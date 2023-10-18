begin;

ALTER TABLE
    user_challenges
ADD
    COLUMN IF NOT EXISTS created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW();

ALTER TABLE
    challenges
ADD
    COLUMN IF NOT EXISTS cooldown_days INTEGER DEFAULT NULL;

commit;