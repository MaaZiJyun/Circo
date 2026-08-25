import AppKit
import Foundation

// Usage:
// swift icon.swift AppIcon.icns

guard CommandLine.arguments.count == 2 else {
  print("Usage: swift icon.swift <output.icns>")
  exit(2)
}

// macOS ICNS variants
let variants = [
  ("icp4", 16),
  ("icp5", 32),
  ("icp6", 64),
  ("ic07", 128),
  ("ic08", 256),
  ("ic09", 512),
  ("ic10", 1024),
]


// MARK: - Generate PNG Icon

func pngIcon(_ size: Int) -> Data? {
  guard let bitmap = NSBitmapImageRep(
    bitmapDataPlanes: nil,
    pixelsWide: size,
    pixelsHigh: size,
    bitsPerSample: 8,
    samplesPerPixel: 4,
    hasAlpha: true,
    isPlanar: false,
    colorSpaceName: .deviceRGB,
    bytesPerRow: 0,
    bitsPerPixel: 0
  ) else {
    return nil
  }

  bitmap.size = NSSize(
    width: size,
    height: size
  )

  NSGraphicsContext.saveGraphicsState()

  NSGraphicsContext.current = NSGraphicsContext(
    bitmapImageRep: bitmap
  )

  let canvas = NSRect(
    x: 0,
    y: 0,
    width: size,
    height: size
  )


  // MARK: - Transparent Canvas

  NSColor.clear.setFill()
  canvas.fill()


  // MARK: - Background Tile

  let tileInset = CGFloat(size) * 0.07

  let tile = canvas.insetBy(
    dx: tileInset,
    dy: tileInset
  )

  let cornerRadius = CGFloat(size) * 0.22

  let background = NSBezierPath(
    roundedRect: tile,
    xRadius: cornerRadius,
    yRadius: cornerRadius
  )

  // Black → dark gray gradient
  let backgroundGradient = NSGradient(
    colors: [
      NSColor(
        calibratedWhite: 0.16,
        alpha: 1
      ),
      NSColor(
        calibratedWhite: 0.025,
        alpha: 1
      ),
    ]
  )

  backgroundGradient?.draw(
    in: background,
    angle: -90
  )


  // MARK: - Ring Geometry

  let center = NSPoint(
    x: CGFloat(size) / 2,
    y: CGFloat(size) / 2
  )

  // Slightly smaller circle + thicker stroke
  // gives the icon a stronger visual weight.
  let radius = CGFloat(size) * 0.23

  let ringRect = NSRect(
    x: center.x - radius,
    y: center.y - radius,
    width: radius * 2,
    height: radius * 2
  )


  // MARK: - Main White Ring

  let ring = NSBezierPath(
    ovalIn: ringRect
  )

  ring.lineWidth = max(
    2.5,
    CGFloat(size) * 0.075
  )

  ring.lineCapStyle = .round
  ring.lineJoinStyle = .round

  NSColor(
    calibratedWhite: 0.94,
    alpha: 1
  ).setStroke()

  ring.stroke()


  // MARK: - Gray Accent Arc

  let accent = NSBezierPath()

  accent.appendArc(
    withCenter: center,
    radius: radius,
    startAngle: 305,
    endAngle: 55
  )

  accent.lineWidth = max(
    2.5,
    CGFloat(size) * 0.082
  )

  accent.lineCapStyle = .round
  accent.lineJoinStyle = .round

  NSColor(
    calibratedWhite: 0.48,
    alpha: 1
  ).setStroke()

  accent.stroke()


  // MARK: - Finish Drawing

  NSGraphicsContext.restoreGraphicsState()

  return bitmap.representation(
    using: .png,
    properties: [:]
  )
}


// MARK: - ICNS Helpers

func appendUInt32(
  _ value: UInt32,
  to data: inout Data
) {
  var encoded = value.bigEndian

  withUnsafeBytes(of: &encoded) {
    data.append(contentsOf: $0)
  }
}


// MARK: - Generate ICNS Chunks

var chunks = Data()

for (code, size) in variants {
  guard let png = pngIcon(size) else {
    print("Failed to generate \(size)x\(size) icon.")
    continue
  }

  // Chunk type
  chunks.append(
    Data(code.utf8)
  )

  // Chunk length
  appendUInt32(
    UInt32(png.count + 8),
    to: &chunks
  )

  // PNG data
  chunks.append(png)
}


// MARK: - Build ICNS File

var icns = Data(
  "icns".utf8
)

// Total ICNS length
appendUInt32(
  UInt32(chunks.count + 8),
  to: &icns
)

icns.append(chunks)


// MARK: - Write File

let outputURL = URL(
  fileURLWithPath: CommandLine.arguments[1]
)

do {
  try icns.write(
    to: outputURL,
    options: .atomic
  )

  print("Icon generated successfully:")
  print(outputURL.path)

} catch {
  print("Failed to write ICNS file:")
  print(error.localizedDescription)
  exit(1)
}