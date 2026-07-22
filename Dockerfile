# ── Builder stage ────────────────────────────────────────────────────────────
FROM rust:1.92.0-bookworm AS builder

RUN apt-get update && apt-get install -y --no-install-recommends \
    pkg-config \
    libssl-dev \
    git \
    cmake \
    clang \
    && rm -rf /var/lib/apt/lists/*

WORKDIR /build

COPY .cargo .cargo
COPY crates crates
COPY Cargo.toml Cargo.lock
COPY rust-toolchain.toml
COPY bin bin
COPY third_party third_party
COPY prod/mc prod/mc

RUN cargo build --locked -p intelekt-pager-bin --profile release-dist --features release-dist 2>&1 || \
    cargo build --locked -p intelekt-pager-bin --release

# ── Runtime stage ────────────────────────────────────────────────────────────
FROM debian:bookworm-slim

RUN apt-get update && apt-get install -y --no-install-recommends \
    ca-certificates \
    git \
    openssh-client \
    nodejs \
    npm \
    curl \
    bash \
    coreutils \
    findutils \
    grep \
    ripgrep \
    bubblewrap \
    && rm -rf /var/lib/apt/lists/*

COPY --from=builder /build/target/release-dist/intelekt /usr/local/bin/intelekt

RUN mkdir -p /etc/grok /data/.grok /workspace /home/intelekt && \
    printf '[ui]\ndisable_bypass_permissions_mode = true\n' > /etc/grok/requirements.toml && \
    chmod 644 /etc/grok/requirements.toml && \
    chown -R 1000:1000 /data /workspace /home/intelekt

WORKDIR /workspace

ENV GROK_HOME=/data/.grok \
    GROK_SANDBOX=hosted \
    GROK_DISABLE_AUTOUPDATER=1 \
    HOME=/home/intelekt

COPY docker/entrypoint.sh /entrypoint.sh
COPY docker/session-server.js /opt/session-server.js
RUN chmod +x /entrypoint.sh

EXPOSE 8080

ENTRYPOINT ["/entrypoint.sh"]
