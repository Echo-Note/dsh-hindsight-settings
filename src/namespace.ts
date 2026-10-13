/**
 * Identifiers shared by both halves.
 *
 * Deliberately its own module: the browser half may not import anything that touches node builtins,
 * and the node half needs the same strings. A mismatch between `ENTRY_ID` and the row id in
 * `cordis.patch.yml` silently detaches the page from its own config form — the settings form
 * namespace IS the profile entry id — so the test for this file reads the patch and compares.
 */

/** This package's name, as `cordis.patch.yml` mounts it and as the module loader keys the bundle. */
export const PACKAGE_NAME = "@local/dsh-hindsight-settings";

/** The Loader entry id this package mounts under; also its settings-form namespace. */
export const ENTRY_ID = "hindsight-settings";

/** The package whose settings this page edits. */
export const UPSTREAM_PACKAGE = "@vectorize-io/hindsight-coding-agents";

/** The single config file every Hindsight coding-agent harness reads. */
export const CONFIG_FILE_HINT = "~/.hindsight/coding-agent.json";
