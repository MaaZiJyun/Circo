from pathlib import Path
from PIL import Image
import argparse


def rgba_to_hex(r: int, g: int, b: int) -> str:
    return f"#{r:02x}{g:02x}{b:02x}"


def convert_png_to_svg(
    input_file: Path,
    output_file: Path,
    alpha_threshold: int = 0,
):
    """
    Convert a PNG into a real SVG composed of <rect> elements.

    Consecutive pixels with the same RGBA value on each row
    are merged into a single rectangle.
    """

    image = Image.open(input_file).convert("RGBA")

    width, height = image.size

    svg = [
        '<svg xmlns="http://www.w3.org/2000/svg"',
        f'     viewBox="0 0 {width} {height}"',
        f'     width="{width}"',
        f'     height="{height}"',
        '     shape-rendering="crispEdges">',
    ]

    rect_count = 0

    for y in range(height):
        x = 0

        while x < width:
            color = image.getpixel((x, y))

            r, g, b, a = color

            # Skip transparent pixels
            if a <= alpha_threshold:
                x += 1
                continue

            start_x = x
            x += 1

            # Merge consecutive pixels with the same color
            while (
                x < width
                and image.getpixel((x, y)) == color
            ):
                x += 1

            rect_width = x - start_x

            attributes = [
                f'x="{start_x}"',
                f'y="{y}"',
                f'width="{rect_width}"',
                'height="1"',
                f'fill="{rgba_to_hex(r, g, b)}"',
            ]

            # Preserve semi-transparent pixels
            if a < 255:
                opacity = a / 255

                attributes.append(
                    f'fill-opacity="{opacity:.4f}"'
                )

            svg.append(
                "  <rect "
                + " ".join(attributes)
                + " />"
            )

            rect_count += 1

    svg.append("</svg>")

    # Create output directory if necessary
    output_file.parent.mkdir(
        parents=True,
        exist_ok=True,
    )

    output_file.write_text(
        "\n".join(svg),
        encoding="utf-8",
    )

    return width, height, rect_count


def convert_directory(
    input_dir: Path,
    output_dir: Path,
    alpha_threshold: int = 0,
):
    """
    Recursively convert every PNG inside input_dir.

    Directory structure is preserved inside output_dir.
    """

    if not input_dir.exists():
        raise FileNotFoundError(
            f"Input directory does not exist: {input_dir}"
        )

    if not input_dir.is_dir():
        raise NotADirectoryError(
            f"Input path is not a directory: {input_dir}"
        )

    # Recursive search
    png_files = sorted(
        path
        for path in input_dir.rglob("*")
        if path.is_file()
        and path.suffix.lower() == ".png"
    )

    if not png_files:
        print(
            f"No PNG files found in: {input_dir}"
        )
        return

    print(
        f"Found {len(png_files)} PNG file(s).\n"
    )

    success = 0
    failed = 0

    for index, input_file in enumerate(
        png_files,
        start=1,
    ):
        # Path relative to input directory
        relative_path = input_file.relative_to(
            input_dir
        )

        # Keep the same directory structure,
        # but change .png → .svg
        output_file = (
            output_dir
            / relative_path
        ).with_suffix(".svg")

        try:
            width, height, rect_count = (
                convert_png_to_svg(
                    input_file,
                    output_file,
                    alpha_threshold,
                )
            )

            success += 1

            print(
                f"[{index}/{len(png_files)}] "
                f"{relative_path}"
                f"  →  "
                f"{output_file.relative_to(output_dir)}"
                f"  ({width}×{height}, "
                f"{rect_count} rects)"
            )

        except Exception as error:
            failed += 1

            print(
                f"[{index}/{len(png_files)}] "
                f"FAILED: {relative_path}"
            )

            print(
                f"    {error}"
            )

    print()
    print("Done.")
    print(f"Converted: {success}")
    print(f"Failed:    {failed}")
    print(f"Output:    {output_dir.resolve()}")


def main():
    parser = argparse.ArgumentParser(
        description=(
            "Batch convert pixel-art PNG files "
            "into real SVG files."
        )
    )

    parser.add_argument(
        "-i",
        "--input",
        required=True,
        type=Path,
        help="Directory containing PNG files",
    )

    parser.add_argument(
        "-o",
        "--output",
        required=True,
        type=Path,
        help="Directory for generated SVG files",
    )

    parser.add_argument(
        "--alpha-threshold",
        type=int,
        default=0,
        choices=range(0, 256),
        metavar="0-255",
        help=(
            "Ignore pixels with alpha <= this value "
            "(default: 0)"
        ),
    )

    args = parser.parse_args()

    convert_directory(
        input_dir=args.input,
        output_dir=args.output,
        alpha_threshold=args.alpha_threshold,
    )


if __name__ == "__main__":
    main()