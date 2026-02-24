import AppKit
import Foundation

struct Palette {
  static let tile = NSColor(calibratedRed: 0xF4 / 255.0, green: 0xF4 / 255.0, blue: 0xF5 / 255.0, alpha: 1)
  static let tileBorder = NSColor(calibratedRed: 0xD8 / 255.0, green: 0xD8 / 255.0, blue: 0xDC / 255.0, alpha: 1)
  static let page = NSColor(calibratedRed: 0xFF / 255.0, green: 0xFD / 255.0, blue: 0xF8 / 255.0, alpha: 1)
  static let pageBorder = NSColor(calibratedRed: 0xE8 / 255.0, green: 0xE6 / 255.0, blue: 0xE0 / 255.0, alpha: 1)
  static let toolbarLine = NSColor(calibratedRed: 0xD9 / 255.0, green: 0xD9 / 255.0, blue: 0xDD / 255.0, alpha: 0.9)
  static let textPrimary = NSColor(calibratedRed: 0x1C / 255.0, green: 0x1C / 255.0, blue: 0x1E / 255.0, alpha: 0.9)
  static let textSecondary = NSColor(calibratedRed: 0x6B / 255.0, green: 0x6B / 255.0, blue: 0x6F / 255.0, alpha: 0.72)
  static let accent = NSColor(calibratedRed: 0x50 / 255.0, green: 0x7E / 255.0, blue: 0x95 / 255.0, alpha: 1)
  static let accentSoft = NSColor(calibratedRed: 0x50 / 255.0, green: 0x7E / 255.0, blue: 0x95 / 255.0, alpha: 0.14)
}

func roundedRect(_ rect: CGRect, radius: CGFloat) -> NSBezierPath {
  NSBezierPath(roundedRect: rect, xRadius: radius, yRadius: radius)
}

func fillRounded(_ rect: CGRect, radius: CGFloat, color: NSColor) {
  color.setFill()
  roundedRect(rect, radius: radius).fill()
}

func strokeRounded(_ rect: CGRect, radius: CGFloat, color: NSColor, width: CGFloat) {
  color.setStroke()
  let path = roundedRect(rect, radius: radius)
  path.lineWidth = width
  path.stroke()
}

func drawLineBar(_ rect: CGRect, color: NSColor) {
  color.setFill()
  let r = min(rect.height / 2, rect.width / 2)
  roundedRect(rect, radius: r).fill()
}

func drawIcon(size: Int, to outputURL: URL) throws {
  let canvas = CGFloat(size)
  guard let rep = NSBitmapImageRep(
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
    throw NSError(domain: "generate_app_icons", code: 1, userInfo: [NSLocalizedDescriptionKey: "Failed to allocate bitmap"])
  }

  guard let ctx = NSGraphicsContext(bitmapImageRep: rep) else {
    throw NSError(domain: "generate_app_icons", code: 1, userInfo: [NSLocalizedDescriptionKey: "Failed to create graphics context"])
  }

  NSGraphicsContext.saveGraphicsState()
  NSGraphicsContext.current = ctx
  defer { NSGraphicsContext.restoreGraphicsState() }

  ctx.imageInterpolation = .high
  NSColor.clear.setFill()
  NSRect(x: 0, y: 0, width: canvas, height: canvas).fill()

  let outerInset = canvas * 0.06
  let tileRect = CGRect(x: outerInset, y: outerInset, width: canvas - (outerInset * 2), height: canvas - (outerInset * 2))
  let tileRadius = canvas * 0.19

  fillRounded(tileRect, radius: tileRadius, color: Palette.tile)

  // Very subtle top chrome strip to echo MUWI's toolbar pattern.
  let chromeHeight = tileRect.height * 0.16
  let chromeRect = CGRect(x: tileRect.minX, y: tileRect.maxY - chromeHeight, width: tileRect.width, height: chromeHeight)
  Palette.page.withAlphaComponent(0.35).setFill()
  NSBezierPath(rect: chromeRect).fill()

  // Toolbar separator line
  drawLineBar(
    CGRect(
      x: tileRect.minX + tileRect.width * 0.08,
      y: chromeRect.minY + max(1, canvas * 0.004),
      width: tileRect.width * 0.84,
      height: max(2, canvas * 0.010)
    ),
    color: Palette.toolbarLine
  )

  let borderWidth = max(2, canvas * 0.014)
  strokeRounded(tileRect.insetBy(dx: borderWidth * 0.5, dy: borderWidth * 0.5), radius: tileRadius - (borderWidth * 0.5), color: Palette.tileBorder, width: borderWidth)

  let pageRect = CGRect(
    x: tileRect.minX + tileRect.width * 0.13,
    y: tileRect.minY + tileRect.height * 0.17,
    width: tileRect.width * 0.74,
    height: tileRect.height * 0.60
  )
  let pageRadius = canvas * 0.08

  // Soft shadow under page (kept subtle to match design system).
  if let shadow = NSShadow() as NSShadow? {
    shadow.shadowBlurRadius = canvas * 0.018
    shadow.shadowOffset = NSSize(width: 0, height: -canvas * 0.006)
    shadow.shadowColor = NSColor.black.withAlphaComponent(0.07)
    shadow.set()
  }
  fillRounded(pageRect, radius: pageRadius, color: Palette.page)
  NSShadow().set()
  strokeRounded(pageRect.insetBy(dx: max(1, canvas * 0.003), dy: max(1, canvas * 0.003)), radius: pageRadius - max(1, canvas * 0.003), color: Palette.pageBorder, width: max(2, canvas * 0.008))

  // Accent rail: references MUWI's single-accent, panel-driven layout.
  let railRect = CGRect(
    x: pageRect.minX + pageRect.width * 0.085,
    y: pageRect.minY + pageRect.height * 0.12,
    width: pageRect.width * 0.12,
    height: pageRect.height * 0.76
  )
  fillRounded(railRect, radius: railRect.width * 0.46, color: Palette.accent)
  fillRounded(
    CGRect(x: railRect.minX + railRect.width * 0.18, y: railRect.minY + railRect.height * 0.14, width: railRect.width * 0.64, height: railRect.height * 0.72),
    radius: railRect.width * 0.28,
    color: Palette.accentSoft
  )

  // Text lines on the page body.
  let linesX = railRect.maxX + pageRect.width * 0.07
  let lineH = max(6, pageRect.height * 0.072)
  let lineGap = pageRect.height * 0.105
  let lineYStart = pageRect.maxY - pageRect.height * 0.26
  let widths: [CGFloat] = [0.55, 0.47, 0.60, 0.32]

  for (i, w) in widths.enumerated() {
    let y = lineYStart - (CGFloat(i) * lineGap)
    let color = i == widths.count - 1 ? Palette.textSecondary : Palette.textPrimary
    drawLineBar(
      CGRect(x: linesX, y: y, width: pageRect.width * w, height: lineH),
      color: color
    )
  }

  // Folded corner hint for "document" metaphor.
  let foldSize = pageRect.width * 0.17
  let foldOrigin = CGPoint(x: pageRect.maxX - foldSize * 0.95, y: pageRect.maxY - foldSize * 0.95)
  let foldPath = NSBezierPath()
  foldPath.move(to: CGPoint(x: foldOrigin.x, y: foldOrigin.y + foldSize))
  foldPath.line(to: CGPoint(x: foldOrigin.x + foldSize, y: foldOrigin.y + foldSize))
  foldPath.line(to: CGPoint(x: foldOrigin.x + foldSize, y: foldOrigin.y))
  foldPath.close()
  NSColor.white.withAlphaComponent(0.65).setFill()
  foldPath.fill()

  let crease = NSBezierPath()
  crease.move(to: CGPoint(x: pageRect.maxX - foldSize * 0.10, y: pageRect.maxY - foldSize))
  crease.line(to: CGPoint(x: pageRect.maxX - foldSize, y: pageRect.maxY - foldSize * 0.10))
  crease.lineWidth = max(2, canvas * 0.008)
  Palette.pageBorder.withAlphaComponent(0.85).setStroke()
  crease.stroke()

  guard let pngData = rep.representation(using: .png, properties: [:]) else {
    throw NSError(domain: "generate_app_icons", code: 1, userInfo: [NSLocalizedDescriptionKey: "Failed to encode PNG"])
  }

  try pngData.write(to: outputURL)
}

let args = CommandLine.arguments
guard args.count >= 2 else {
  fputs("Usage: generate_app_icons.swift <output-dir>\n", stderr)
  exit(1)
}

let outputDir = URL(fileURLWithPath: args[1], isDirectory: true)
try FileManager.default.createDirectory(at: outputDir, withIntermediateDirectories: true)

let masterURL = outputDir.appendingPathComponent("icon-master-1024.png")
try drawIcon(size: 1024, to: masterURL)

print("Generated \(masterURL.path)")
