module.exports = {
  run: [{
    method: "shell.run",
    params: {
      message: "git pull"
    }
  }, {
    method: "shell.run",
    params: {
      path: "app",
      message: "git pull"
    }
  }, {
    // Rebuild the venv from scratch on every update.
    // After the fs.link venv dedup below, every package in site-packages is a
    // symlink/junction into the shared pip drive, and uv cannot see linked
    // packages at all ("uv pip list" reports an empty venv). Incremental
    // "uv pip install" on a deduplicated venv therefore reinstalls unconstrained
    // versions next to the linked ones (e.g. torchaudio 2.11.0 beside torch
    // 2.4.1 -> "OSError: [WinError 127]") and writes through the links,
    // corrupting both the venv and the shared drive. A fresh venv has no links,
    // so the install steps below behave exactly like a fresh install.js run.
    method: "fs.rm",
    params: {
      path: "app/env"
    }
  }, {
    method: "shell.run",
    params: {
      venv: "env",                // Edit this to customize the venv folder path
      path: "app",                // Edit this to customize the path to start the shell from
      message: [
        "uv pip install -e .",
        "uv pip uninstall torchcodec",
        // transformers >= 5 requires torch.float8_e8m0fnu (torch >= 2.7) at import
        // time and breaks the torch 2.4.1 platforms (directml/cpu/mac) with
        // "AttributeError: module 'torch' has no attribute 'float8_e8m0fnu'"
        "uv pip install hf_xet transformers==4.50.3"
      ]
    }
  }, {
    // Re-pin the platform/gpu-correct torch stack AFTER the editable install:
    // f5-tts depends on an unpinned "torchcodec", whose recent releases require
    // a newer torch, so "uv pip install -e ." can upgrade torch/torchaudio to
    // versions that mismatch each other (and torch-directml), breaking the venv
    // with "OSError: [WinError 127]". Running torch.js last forces the stack
    // back to the pinned, matching versions.
    method: "script.start",
    params: {
      uri: "torch.js",
      params: {
        venv: "env",
        path: "app"
      }
    }
  }, {
    method: "fs.link",
    params: {
      venv: "app/env"
    }
  }]
}
