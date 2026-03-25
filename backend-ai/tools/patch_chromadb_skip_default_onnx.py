"""
ChromaDB may load default ONNX (onnxruntime) when DefaultEmbeddingFunction is used.

- chromadb 0.4.x / 0.5.x: DefaultEmbeddingFunction() was a function in
  chromadb/utils/embedding_functions/__init__.py — patch to return None.
- chromadb 1.x: DefaultEmbeddingFunction is a class in chromadb/api/types.py;
  ONNX is lazy-loaded in __call__ — patch __call__ to skip ONNX.

LangChain + Gemini in this project always pass embedding_function explicitly.

Usage (backend-ai, venv active):
  python tools/patch_chromadb_skip_default_onnx.py

Does NOT import chromadb.
"""
from __future__ import annotations

import pathlib
import sys

MARKER_LEGACY = "# Ai-Law: skip ONNX at import"
MARKER_MODERN = "# Ai-Law: skip ONNX (Windows DLL). LangChain passes explicit embedding_function."

# --- chromadb 0.5.x style (function in embedding_functions/__init__.py) ---
OLD_DEFAULT_EF = """def DefaultEmbeddingFunction() -> Optional[EmbeddingFunction[Documents]]:
    if is_thin_client:
        return None
    else:
        return cast(
            EmbeddingFunction[Documents],
            # This is implicitly imported above
            ONNXMiniLM_L6_V2(),  # type: ignore[name-defined] # noqa: F821
        )"""

NEW_DEFAULT_EF = f"""def DefaultEmbeddingFunction() -> Optional[EmbeddingFunction[Documents]]:
    {MARKER_LEGACY} (Windows DLL / server). Use explicit embedding_function.
    return None"""

# --- chromadb 1.5.x style (class DefaultEmbeddingFunction in api/types.py) ---
OLD_TYPES_CALL = """    def __call__(self, input: Documents) -> Embeddings:
        # Import here to avoid circular imports
        from chromadb.utils.embedding_functions.onnx_mini_lm_l6_v2 import (
            ONNXMiniLM_L6_V2,
        )

        return ONNXMiniLM_L6_V2()(input)"""

NEW_TYPES_CALL = f"""    def __call__(self, input: Documents) -> Embeddings:
        {MARKER_MODERN}
        raise RuntimeError(
            "Default Chroma ONNX embedding is disabled; pass embedding_function explicitly."
        )"""


def _find_in_path(rel_parts: tuple[str, ...]) -> pathlib.Path | None:
    for p in sys.path:
        if not p or p == ".":
            continue
        candidate = pathlib.Path(p).joinpath(*rel_parts)
        if candidate.is_file():
            return candidate
    return None


def find_embedding_functions_init() -> pathlib.Path | None:
    return _find_in_path(("chromadb", "utils", "embedding_functions", "__init__.py"))


def find_api_types() -> pathlib.Path | None:
    return _find_in_path(("chromadb", "api", "types.py"))


def _backup(path: pathlib.Path) -> pathlib.Path:
    backup = path.with_suffix(path.suffix + ".bak_chroma_onnx")
    if not backup.exists():
        backup.write_text(path.read_text(encoding="utf-8"), encoding="utf-8")
        print(f"Backup: {backup}", flush=True)
    return backup


def patch_modern_types(path: pathlib.Path) -> bool:
    text = path.read_text(encoding="utf-8")
    if MARKER_MODERN in text:
        print(f"OK (already patched): {path}", flush=True)
        return True
    if OLD_TYPES_CALL not in text:
        return False
    _backup(path)
    path.write_text(text.replace(OLD_TYPES_CALL, NEW_TYPES_CALL, 1), encoding="utf-8")
    print(f"Patched (chromadb 1.x DefaultEmbeddingFunction.__call__): {path}", flush=True)
    return True


def patch_legacy_embedding_init(path: pathlib.Path) -> bool:
    text = path.read_text(encoding="utf-8")
    if MARKER_LEGACY in text:
        print(f"OK (already patched): {path}", flush=True)
        return True
    if OLD_DEFAULT_EF not in text:
        return False
    _backup(path)
    path.write_text(text.replace(OLD_DEFAULT_EF, NEW_DEFAULT_EF, 1), encoding="utf-8")
    print(f"Patched (chromadb 0.5.x DefaultEmbeddingFunction): {path}", flush=True)
    return True


def main() -> int:
    types_path = find_api_types()
    if types_path is not None:
        if patch_modern_types(types_path):
            return 0

    init_path = find_embedding_functions_init()
    if init_path is not None:
        if patch_legacy_embedding_init(init_path):
            return 0
        # Found file but no known block
        text = init_path.read_text(encoding="utf-8")
        if MARKER_LEGACY not in text:
            print(
                f"WARN: No patchable DefaultEmbeddingFunction block in {init_path} "
                f"(chromadb layout changed). If you use explicit embedding_function only, you can ignore this.",
                flush=True,
            )
            return 0

    if types_path is None and init_path is None:
        print("ERROR: chromadb package not found on sys.path.", flush=True)
        return 1

    if types_path is not None and MARKER_MODERN not in types_path.read_text(encoding="utf-8"):
        print(
            f"WARN: chromadb 1.x {types_path} has no known DefaultEmbeddingFunction.__call__ block. "
            f"ONNX may load lazily only when default embedding is used. Safe if LangChain passes embedding_function.",
            flush=True,
        )
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
