package cmd

import (
	"fmt"
	"os"

	"comms.audius.co/storage/telemetry"
	"github.com/spf13/cobra"
)

var outputFile string

var getFileCmd = &cobra.Command{
	Use:   "getFile [filename]",
	Short: "",
	Long: ``,
	Args: cobra.ExactArgs(1),
	Run: func(cmd *cobra.Command, args []string) {
		if len(args) < 1 {
			return
		}

		filename := args[0]

		telemetry.DiscardLogs()
		clientCount, err := initClients()
		if err != nil || clientCount < 1 {
			fmt.Println("Couldn't find any clients")
			return
		}

		client := ClientList[0]

		audioData, err := client.GetFile(filename)
		if err != nil {
			fmt.Printf("error getting file, %+v\n", err)
			return
		}

		if outputFile != "" {
			os.WriteFile(outputFile, audioData, 0777)
		}

		os.Stdout.Write(audioData)
	},
}

func init() {
	storageCmd.AddCommand(getFileCmd)
	getFileCmd.Flags().StringVarP(&outputFile, "output", "o", "", "output filename")
}