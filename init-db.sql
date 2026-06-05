CREATE DATABASE user_db;
CREATE DATABASE rant_db;
CREATE DATABASE interaction_db;

\connect user_db

CREATE TABLE users (
    id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    username      VARCHAR(50)  UNIQUE NOT NULL,
    email         VARCHAR(255) UNIQUE NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    display_name  VARCHAR(100),
    role          VARCHAR(20)  DEFAULT 'student' NOT NULL
                  CHECK (role IN ('student', 'admin')),
    created_at    TIMESTAMPTZ  DEFAULT now() NOT NULL,
    updated_at    TIMESTAMPTZ  DEFAULT now() NOT NULL
);

\connect rant_db

CREATE TABLE rants (
    id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id         UUID         NOT NULL,
    title           VARCHAR(200) NOT NULL,
    body            TEXT         NOT NULL,
    category        VARCHAR(20)  NOT NULL
                    CHECK (category IN ('akademik', 'fasilitas', 'dosen', 'organisasi', 'lainnya')),
    status          VARCHAR(20)  DEFAULT 'open' NOT NULL
                    CHECK (status IN ('open', 'acknowledged', 'resolved', 'closed')),
    is_anonymous    BOOLEAN      DEFAULT false NOT NULL,
    upvotes_count   INTEGER      DEFAULT 0 NOT NULL,
    downvotes_count INTEGER      DEFAULT 0 NOT NULL,
    comments_count  INTEGER      DEFAULT 0 NOT NULL,
    created_at      TIMESTAMPTZ  DEFAULT now() NOT NULL,
    updated_at      TIMESTAMPTZ  DEFAULT now() NOT NULL
);

CREATE INDEX idx_rants_category ON rants(category);
CREATE INDEX idx_rants_status   ON rants(status);
CREATE INDEX idx_rants_created  ON rants(created_at DESC);

\connect interaction_db

CREATE TABLE votes (
    id         UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id    UUID        NOT NULL,
    rant_id    UUID        NOT NULL,
    vote_type  VARCHAR(10) NOT NULL CHECK (vote_type IN ('up', 'down')),
    created_at TIMESTAMPTZ DEFAULT now() NOT NULL,
    UNIQUE(user_id, rant_id)
);

CREATE TABLE comments (
    id           UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id      UUID    NOT NULL,
    rant_id      UUID    NOT NULL,
    parent_id    UUID    REFERENCES comments(id) ON DELETE CASCADE,
    body         TEXT    NOT NULL,
    is_anonymous BOOLEAN DEFAULT false NOT NULL,
    created_at   TIMESTAMPTZ DEFAULT now() NOT NULL,
    updated_at   TIMESTAMPTZ DEFAULT now() NOT NULL
);

CREATE INDEX idx_votes_rant    ON votes(rant_id);
CREATE INDEX idx_votes_user    ON votes(user_id);
CREATE INDEX idx_comments_rant ON comments(rant_id);
