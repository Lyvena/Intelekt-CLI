//! Shared utilities used by both `intelekt-shell` and its downstream clients
//! (e.g. `intelekt-pager-render`). This crate sits upstream of `intelekt-shell`
//! so it must never depend on it.

pub mod clipboard;
pub mod placeholder_images;
pub mod session;
pub mod stderr;
pub mod ui_config;
