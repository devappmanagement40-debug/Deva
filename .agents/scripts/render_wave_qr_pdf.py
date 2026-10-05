from pathlib import Path
import fitz


source = Path("attached_assets/static_wave_qr_1791213286136.pdf")
output_dir = Path(".agents/outputs")
output_dir.mkdir(parents=True, exist_ok=True)

document = fitz.open(source)
print(f"pages={document.page_count}")
for page_number, page in enumerate(document, start=1):
    print(f"page_{page_number}_bounds={page.rect}")
    print(f"page_{page_number}_embedded_images={len(page.get_images(full=True))}")

    rendered_path = output_dir / f"wave_qr_page_{page_number}.png"
    page.get_pixmap(matrix=fitz.Matrix(3, 3), alpha=False).save(rendered_path)
    print(f"rendered={rendered_path} bytes={rendered_path.stat().st_size}")

    for image_number, image_info in enumerate(page.get_images(full=True), start=1):
        xref = image_info[0]
        extracted = document.extract_image(xref)
        image_path = output_dir / f"wave_qr_embedded_{image_number}.{extracted['ext']}"
        image_path.write_bytes(extracted["image"])
        print(f"embedded={image_path} bytes={image_path.stat().st_size}")
