#requires -Version 7.0
$ErrorActionPreference = 'Stop'
Add-Type -AssemblyName PresentationCore, WindowsBase, PresentationFramework
$brandRoot = Split-Path -Parent $PSScriptRoot
$brandImages = Join-Path $brandRoot 'public/images'
$brandIcons = Join-Path $brandRoot 'public/icons'
[void][System.IO.Directory]::CreateDirectory($brandImages)
$brandCulture = [System.Globalization.CultureInfo]::GetCultureInfo('ar-SA')
$brandInvariant = [System.Globalization.CultureInfo]::InvariantCulture
$brandText = [System.Windows.Media.FormattedText]::new('قضاء', $brandCulture, [System.Windows.FlowDirection]::RightToLeft, [System.Windows.Media.Typeface]::new('Arabic Typesetting'), 220.0, [System.Windows.Media.Brushes]::White, 1.0)
$brandGeometry = $brandText.BuildGeometry([System.Windows.Point]::new(0, 0))
$brandBounds = $brandGeometry.Bounds
$brandPathGeometry = [System.Windows.Media.PathGeometry]::CreateFromGeometry($brandGeometry)
$brandPath = $brandPathGeometry.ToString($brandInvariant) -replace '^F[01]\s*', ''
if ($brandPath -notmatch '^[Mm]' -or $brandPath -match 'System\.Windows') { throw 'Arabic wordmark geometry was not serialized as an SVG path.' }
function BrandNumber([double]$value) { return $value.ToString('0.###', $brandInvariant) }
$brandWidth = BrandNumber ($brandBounds.Width + 20)
$brandHeight = BrandNumber ($brandBounds.Height + 20)
$brandX = BrandNumber (10 - $brandBounds.X)
$brandY = BrandNumber (10 - $brandBounds.Y)
$brandWordmark = "<svg xmlns=`"http://www.w3.org/2000/svg`" viewBox=`"0 0 $brandWidth $brandHeight`" role=`"img`" aria-label=`"قضاء`"><g transform=`"translate($brandX $brandY)`" fill=`"#d5b77a`"><path d=`"$brandPath`"/></g></svg>"
[System.IO.File]::WriteAllText((Join-Path $brandImages 'qada-wordmark.svg'), $brandWordmark, [System.Text.UTF8Encoding]::new($false))
$brandScale = 340 / $brandBounds.Width
$brandTx = 256 - ($brandBounds.X + $brandBounds.Width / 2) * $brandScale
$brandTy = 246 - ($brandBounds.Y + $brandBounds.Height / 2) * $brandScale
$brandTransform = "translate($(BrandNumber $brandTx) $(BrandNumber $brandTy)) scale($(BrandNumber $brandScale))"
$brandSvg = "<svg xmlns=`"http://www.w3.org/2000/svg`" viewBox=`"0 0 512 512`"><defs><linearGradient id=`"bg`" x2=`"1`" y2=`"1`"><stop stop-color=`"#315746`"/><stop offset=`"1`" stop-color=`"#142e24`"/></linearGradient><linearGradient id=`"ink`" x2=`"0.7`" y2=`"1`"><stop stop-color=`"#f0dfb3`"/><stop offset=`"1`" stop-color=`"#c29a51`"/></linearGradient></defs><rect width=`"512`" height=`"512`" rx=`"108`" fill=`"url(#bg)`"/><rect x=`"22`" y=`"22`" width=`"468`" height=`"468`" rx=`"88`" fill=`"none`" stroke=`"#d5b77a`" stroke-opacity=`".28`" stroke-width=`"2`"/><g transform=`"$brandTransform`" fill=`"url(#ink)`"><path d=`"$brandPath`"/></g><path d=`"M156 364Q256 391 356 364`" fill=`"none`" stroke=`"#d5b77a`" stroke-width=`"3`" stroke-linecap=`"round`" opacity=`".65`"/></svg>"
[System.IO.File]::WriteAllText((Join-Path $brandRoot 'public/icon.svg'), $brandSvg, [System.Text.UTF8Encoding]::new($false))
function WriteBrandIcon([string]$path, [int]$size, [bool]$maskable = $false, [bool]$foreground = $false) {
  $visual = [System.Windows.Media.DrawingVisual]::new()
  $drawing = $visual.RenderOpen()
  $drawing.PushTransform([System.Windows.Media.ScaleTransform]::new($size / 512.0, $size / 512.0))
  $background = [System.Windows.Media.LinearGradientBrush]::new([System.Windows.Media.ColorConverter]::ConvertFromString('#315746'), [System.Windows.Media.ColorConverter]::ConvertFromString('#142e24'), 45.0)
  $ink = [System.Windows.Media.LinearGradientBrush]::new([System.Windows.Media.ColorConverter]::ConvertFromString('#f0dfb3'), [System.Windows.Media.ColorConverter]::ConvertFromString('#c29a51'), 90.0)
  $radius = if ($maskable) { 0 } else { 108 }
  if (!$foreground) { $drawing.DrawRoundedRectangle($background, $null, [System.Windows.Rect]::new(0, 0, 512, 512), $radius, $radius) }
  $border = [System.Windows.Media.SolidColorBrush]::new([System.Windows.Media.Color]::FromArgb(72, 213, 183, 122))
  if (!$foreground) { $drawing.DrawRoundedRectangle($null, [System.Windows.Media.Pen]::new($border, 2), [System.Windows.Rect]::new(22, 22, 468, 468), 88, 88) }
  $iconScale = if ($foreground) { $brandScale * .82 } else { $brandScale }
  $iconX = 256 - ($brandBounds.X + $brandBounds.Width / 2) * $iconScale
  $iconY = 246 - ($brandBounds.Y + $brandBounds.Height / 2) * $iconScale
  $drawing.PushTransform([System.Windows.Media.TranslateTransform]::new($iconX, $iconY))
  $drawing.PushTransform([System.Windows.Media.ScaleTransform]::new($iconScale, $iconScale))
  $drawing.DrawGeometry($ink, $null, $brandGeometry)
  $drawing.Pop(); $drawing.Pop()
  $sweep = [System.Windows.Media.Geometry]::Parse('M156,364 Q256,391 356,364')
  $sweepBrush = [System.Windows.Media.SolidColorBrush]::new([System.Windows.Media.Color]::FromArgb(166, 213, 183, 122))
  $sweepPen = [System.Windows.Media.Pen]::new($sweepBrush, 3)
  $sweepPen.StartLineCap = [System.Windows.Media.PenLineCap]::Round
  $sweepPen.EndLineCap = [System.Windows.Media.PenLineCap]::Round
  if (!$foreground) { $drawing.DrawGeometry($null, $sweepPen, $sweep) }
  $drawing.Pop(); $drawing.Close()
  $bitmap = [System.Windows.Media.Imaging.RenderTargetBitmap]::new($size, $size, 96, 96, [System.Windows.Media.PixelFormats]::Pbgra32)
  $bitmap.Render($visual)
  $encoder = [System.Windows.Media.Imaging.PngBitmapEncoder]::new()
  $encoder.Frames.Add([System.Windows.Media.Imaging.BitmapFrame]::Create($bitmap))
  $stream = [System.IO.File]::Create($path)
  try { $encoder.Save($stream) } finally { $stream.Dispose() }
}
WriteBrandIcon (Join-Path $brandIcons 'icon-512.png') 512
WriteBrandIcon (Join-Path $brandIcons 'icon-192.png') 192
WriteBrandIcon (Join-Path $brandIcons 'icon-512-maskable.png') 512 $true
WriteBrandIcon (Join-Path $brandRoot 'public/apple-touch-icon.png') 180 $true
WriteBrandIcon (Join-Path $brandIcons 'qada-48-v2.png') 48
# New URLs let Android/Chrome refresh a formerly cached shortcut icon while
# preserving the manifest's stable app identity (/app).
Copy-Item -LiteralPath (Join-Path $brandIcons 'icon-192.png') -Destination (Join-Path $brandIcons 'qada-192-v2.png') -Force
Copy-Item -LiteralPath (Join-Path $brandIcons 'icon-512.png') -Destination (Join-Path $brandIcons 'qada-512-v2.png') -Force
Copy-Item -LiteralPath (Join-Path $brandIcons 'icon-512-maskable.png') -Destination (Join-Path $brandIcons 'qada-maskable-v2.png') -Force
# ICO container with one PNG frame, for launchers requesting /favicon.ico.
$faviconPng = [System.IO.File]::ReadAllBytes((Join-Path $brandIcons 'qada-48-v2.png'))
$faviconStream = [System.IO.File]::Create((Join-Path $brandRoot 'public/favicon.ico'))
$faviconWriter = [System.IO.BinaryWriter]::new($faviconStream)
try {
  $faviconWriter.Write([uint16]0); $faviconWriter.Write([uint16]1); $faviconWriter.Write([uint16]1)
  $faviconWriter.Write([byte]48); $faviconWriter.Write([byte]48); $faviconWriter.Write([byte]0); $faviconWriter.Write([byte]0)
  $faviconWriter.Write([uint16]1); $faviconWriter.Write([uint16]32)
  $faviconWriter.Write([uint32]$faviconPng.Length); $faviconWriter.Write([uint32]22); $faviconWriter.Write($faviconPng)
} finally { $faviconWriter.Dispose(); $faviconStream.Dispose() }
$brandIos = Join-Path $brandRoot 'ios/App/App/Assets.xcassets/AppIcon.appiconset/AppIcon-512@2x.png'
if (Test-Path -LiteralPath $brandIos) { WriteBrandIcon $brandIos 1024 $true }
foreach ($density in @(@('mdpi',48,108), @('hdpi',72,162), @('xhdpi',96,216), @('xxhdpi',144,324), @('xxxhdpi',192,432))) {
  $folder = Join-Path $brandRoot "android/app/src/main/res/mipmap-$($density[0])"
  if (!(Test-Path -LiteralPath $folder)) { continue }
  WriteBrandIcon (Join-Path $folder 'ic_launcher.png') $density[1]
  WriteBrandIcon (Join-Path $folder 'ic_launcher_round.png') $density[1]
  WriteBrandIcon (Join-Path $folder 'ic_launcher_foreground.png') $density[2] $false $true
}
$brandAndroid = Join-Path $brandRoot 'android/app/src/main/res/drawable'
if (Test-Path -LiteralPath $brandAndroid) {
  WriteBrandIcon (Join-Path $brandAndroid 'qada_launcher.png') 512
  WriteBrandIcon (Join-Path $brandAndroid 'qada_launcher_maskable.png') 512 $true
}
Write-Output 'Generated outlined Arabic wordmark and matching web, Android and iOS app icons.'
