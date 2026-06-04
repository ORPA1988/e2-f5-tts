module.exports = {
  requires: {
    bundle: "ai"
  },
  run: [
    {
      method: "shell.run",
      params: {
        message: [
          "git clone https://github.com/SWivid/F5-TTS app",
        ]
      }
    },
    {
      method: "shell.run",
      params: {
        venv: "env",
        path: "app",
        message: [
          "uv pip install -e .",
          "uv pip uninstall torchcodec",
          // transformers >= 5 requires torch.float8_e8m0fnu (torch >= 2.7) at import
          // time and breaks the torch 2.4.1 platforms (directml/cpu/mac) with
          // "AttributeError: module 'torch' has no attribute 'float8_e8m0fnu'"
          "uv pip install hf_xet transformers==4.50.3"
        ]
      }
    },
    {
      // Pin the platform/gpu-correct torch stack AFTER the editable install:
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
          path: "app",
          // xformers: true
        }
      }
    },
    {
      method: "notify",
      params: {
        html: "Click the 'start' tab to get started!"
      }
    }
  ]
}
