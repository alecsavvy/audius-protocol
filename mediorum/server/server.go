package server

import (
	"context"
	"crypto/ecdsa"
	"log"
	"mediorum/crudr"
	"net/http"
	"net/url"
	"os"
	"os/signal"
	"strings"
	"syscall"
	"time"

	"github.com/inconshreveable/log15"
	"github.com/labstack/echo/v4"
	"github.com/labstack/echo/v4/middleware"
	"gocloud.dev/blob"
	_ "gocloud.dev/blob/fileblob"
)

type Peer struct {
	Host   string
	Wallet string
}

func (p Peer) ApiPath(parts ...string) string {
	// todo: remove this method, just use apiPath helper everywhere
	parts = append([]string{p.Host}, parts...)
	return apiPath(parts...)
}

type MediorumConfig struct {
	Self              Peer
	Peers             []Peer
	ReplicationFactor int
	Dir               string `default:"/tmp/mediorum"`
	BlobStoreDSN      string `json:"-"`
	SqliteDSN         string `json:"-"`
	PrivateKey        string `json:"-"`
	ListenPort        string `envconfig:"PORT"`

	// should have a basedir type of thing
	// by default will put db + blobs there

	// StoreAll          bool   // todo: set this to true for "full node"

	privateKey *ecdsa.PrivateKey
}

type MediorumServer struct {
	echo      *echo.Echo
	bucket    *blob.Bucket
	placement *placement
	logger    log15.Logger
	crud      *crudr.Crudr
	quit      chan os.Signal

	StartedAt time.Time
	Config    MediorumConfig
}

var (
	apiBasePath = "/mediorum"
)

func New(config MediorumConfig) (*MediorumServer, error) {

	// validate host config
	if config.Self.Host == "" {
		log.Fatal("host is required")
	} else if hostUrl, err := url.Parse(config.Self.Host); err != nil {
		log.Fatal("invalid host: ", err)
	} else if config.ListenPort == "" {
		config.ListenPort = hostUrl.Port()
	}

	if config.Dir == "" {
		config.Dir = "/tmp/mediorum"
	}

	if config.BlobStoreDSN == "" {
		config.BlobStoreDSN = "file://" + config.Dir + "/blobs"
	}

	if config.SqliteDSN == "" {
		config.SqliteDSN = config.Dir + "/data.db"
	}

	if pk, err := parsePrivateKey(config.PrivateKey); err != nil {
		log.Println("invalid private key: ", err)
	} else {
		config.privateKey = pk
	}

	// ensure dir
	os.MkdirAll(config.Dir, os.ModePerm)
	if strings.HasPrefix(config.BlobStoreDSN, "file://") {
		os.MkdirAll(strings.TrimPrefix(config.BlobStoreDSN, "file://"), os.ModePerm)
	}

	// bucket
	bucket, err := blob.OpenBucket(context.Background(), config.BlobStoreDSN)
	if err != nil {
		return nil, err
	}

	// db
	db := dbMustDial(config.SqliteDSN)

	// crud
	crud := crudr.New(config.Self.Host, db)
	dbMigrate(crud)

	// echoServer server
	echoServer := echo.New()
	echoServer.HideBanner = true
	echoServer.Debug = true

	// Middleware
	echoServer.Use(middleware.Recover())

	ss := &MediorumServer{
		echo:      echoServer,
		bucket:    bucket,
		placement: newPlacement(config),
		crud:      crud,
		logger:    log15.New("from", config.Self.Host),
		quit:      make(chan os.Signal, 1),

		StartedAt: time.Now().UTC(),
		Config:    config,
	}

	// public: uis
	// should probably use basePath
	// and basePath should not be "/api" by default
	// and the uis should be able to know basepath
	// to make it easier to shim into the ol nginx
	echoServer.GET("/", ss.serveUploadUI)

	ss.logger.SetHandler(log15.CallerFileHandler(log15.StdoutHandler))

	basePath := echoServer.Group(apiBasePath)

	// Middleware
	basePath.Use(middleware.Recover())
	basePath.Use(middleware.CORS())

	basePath.GET("", ss.serveUploadUI)
	basePath.GET("/", ss.serveUploadUI)

	// public: uploads
	basePath.GET("/uploads", ss.getUploads)
	basePath.GET("/uploads/:id", ss.getUpload)
	basePath.POST("/uploads", ss.postUpload)

	// status + debug:
	basePath.GET("/status", ss.getStatus)
	basePath.GET("/debug/blobs", ss.dumpBlobs)
	basePath.GET("/debug/uploads", ss.dumpUploads)
	basePath.GET("/debug/ls", ss.getLs)

	// JSON CID stuff
	// basePath.POST("/tracks/metadata", ss.postMetadataCid)

	// internal
	internalApi := basePath.Group("/internal")

	// internal: crud
	internalApi.GET("/crud/stream", ss.getCrudStream)
	internalApi.GET("/crud/bulk", ss.getCrudBulk)

	// should health be internal or public?
	internalApi.GET("/health", ss.getMyHealth)
	internalApi.GET("/health/peers", ss.getPeerHealth)

	// internal: blobs
	internalApi.GET("/blobs/problems", ss.getBlobProblems)
	internalApi.GET("/blobs/location/:key", ss.getBlobLocation)
	internalApi.GET("/blobs/info/:key", ss.getBlobInfo)
	internalApi.GET("/blobs/:key", ss.getBlob)
	internalApi.POST("/blobs", ss.postBlob, middleware.BasicAuth(ss.checkBasicAuth))

	return ss, nil

}

func (ss *MediorumServer) MustStart() {
	// start crud clients
	// routes should match crud routes setup above
	ss.startCrudClients("/mediorum/internal/crud/stream", "/mediorum/internal/crud/bulk")

	// start server
	go func() {

		err := ss.echo.Start(":" + ss.Config.ListenPort)
		if err != nil && err != http.ErrServerClosed {
			panic(err)
		}
	}()

	go ss.startTranscoder()

	go ss.startHealthBroadcaster()

	go ss.startRepairer()

	// signals
	signal.Notify(ss.quit, os.Interrupt, syscall.SIGTERM)
	<-ss.quit
	close(ss.quit)

	ss.Stop()
}

func (ss *MediorumServer) Stop() {
	ss.logger.Debug("stopping")

	ctx, cancel := context.WithTimeout(context.Background(), 10*time.Second)
	defer cancel()

	ss.crud.SSEServer.Close()

	if err := ss.echo.Shutdown(ctx); err != nil {
		ss.logger.Crit("echo shutdown: " + err.Error())
	}

	if db, err := ss.crud.DB.DB(); err == nil {
		if err := db.Close(); err != nil {
			ss.logger.Crit("db shutdown: " + err.Error())
		}
	}

	// todo: stop transcode worker + repairer too

	ss.logger.Debug("bye")

}