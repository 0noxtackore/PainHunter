import argparse
import os
import sys
import urllib.request

MODELS = {
    "1.5b": (
        "https://huggingface.co/Qwen/Qwen2.5-1.5B-Instruct-GGUF/resolve/main/"
        "qwen2.5-1.5b-instruct-q4_k_m.gguf"
    ),
    "0.5b": (
        "https://huggingface.co/Qwen/Qwen2.5-0.5B-Instruct-GGUF/resolve/main/"
        "qwen2.5-0.5b-instruct-q4_k_m.gguf"
    ),
}
MODELS_DIR = os.path.join(os.path.dirname(os.path.abspath(__file__)), "..", "models")


def download(size):
    dest = os.path.join(MODELS_DIR, f"qwen2.5-{size}-instruct-q4_k_m.gguf")

    def show_progress(blocks, block_size, total):
        done = blocks * block_size
        if total > 0:
            percent = min(100, done * 100 // total)
            sys.stdout.write(f"\r{percent}%  ({done / 1e6:.0f} MB / {total / 1e6:.0f} MB)")
            sys.stdout.flush()

    os.makedirs(MODELS_DIR, exist_ok=True)
    print(f"Descargando {os.path.basename(dest)} ...")
    try:
        urllib.request.urlretrieve(MODELS[size], dest, show_progress)
        print("\nDescarga completada.")
    except Exception as error:
        print(f"\nError al descargar: {error}")
        sys.exit(1)


if __name__ == "__main__":
    parser = argparse.ArgumentParser()
    parser.add_argument("size", nargs="?", default="1.5b", choices=list(MODELS))
    args = parser.parse_args()

    dest = os.path.join(MODELS_DIR, f"qwen2.5-{args.size}-instruct-q4_k_m.gguf")
    if os.path.exists(dest):
        print(f"El modelo {args.size} ya existe.")
    else:
        download(args.size)

