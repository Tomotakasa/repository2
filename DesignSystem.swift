import SwiftUI

// MARK: - Color from Hex
extension Color {
    init?(hex: String) {
        var cleaned = hex.trimmingCharacters(in: .whitespacesAndNewlines)
        cleaned = cleaned.hasPrefix("#") ? String(cleaned.dropFirst()) : cleaned
        
        guard cleaned.count == 6,
              let value = UInt64(cleaned, radix: 16) else { return nil }
        
        let r = Double((value >> 16) & 0xFF) / 255.0
        let g = Double((value >> 8) & 0xFF) / 255.0
        let b = Double(value & 0xFF) / 255.0
        self.init(red: r, green: g, blue: b)
    }
    
    func toHex() -> String {
        let uiColor = UIColor(self)
        var r: CGFloat = 0, g: CGFloat = 0, b: CGFloat = 0, a: CGFloat = 0
        uiColor.getRed(&r, green: &g, blue: &b, alpha: &a)
        return String(format: "#%02X%02X%02X",
                      Int(r * 255), Int(g * 255), Int(b * 255))
    }
    
    static let kidsPalette: [Color] = [
        Color(hex: "#FF8FAB") ?? .pink,
        Color(hex: "#FFB3C1") ?? .pink,
        Color(hex: "#74B9FF") ?? .blue,
        Color(hex: "#A29BFE") ?? .purple,
        Color(hex: "#55EFC4") ?? .green,
        Color(hex: "#FFEAA7") ?? .yellow,
        Color(hex: "#FD79A8") ?? .pink,
        Color(hex: "#6C5CE7") ?? .purple,
        Color(hex: "#00B894") ?? .green,
        Color(hex: "#E17055") ?? .orange,
        Color(hex: "#FDCB6E") ?? .yellow,
        Color(hex: "#81ECEC") ?? .cyan
    ]
}

// MARK: - Design System
struct DS {
    static let background = Color(UIColor.systemGroupedBackground)
    static let cardBackground = Color.white
    static let primaryText = Color(hex: "#2D3436") ?? .black
    static let secondaryText = Color(hex: "#636E72") ?? .gray
    static let accent = Color(hex: "#6C5CE7") ?? .purple
    static let accentLight = Color(hex: "#A29BFE") ?? .purple.opacity(0.5)
    static let danger = Color(hex: "#E17055") ?? .red
    static let success = Color(hex: "#00B894") ?? .green
    static let warmYellow = Color(hex: "#FDCB6E") ?? .yellow
    
    static let radiusS: CGFloat = 8
    static let radiusM: CGFloat = 14
    static let radiusL: CGFloat = 20
    static let radiusXL: CGFloat = 28
    
    static let spacingXS: CGFloat = 4
    static let spacingS: CGFloat = 8
    static let spacingM: CGFloat = 16
    static let spacingL: CGFloat = 24
    static let spacingXL: CGFloat = 32
}

extension View {
    func cardShadow() -> some View {
        self.shadow(color: .black.opacity(0.08), radius: 12, x: 0, y: 4)
    }
    
    func lightShadow() -> some View {
        self.shadow(color: .black.opacity(0.05), radius: 6, x: 0, y: 2)
    }
}

// MARK: - Font Helpers
extension Font {
    static func rounded(_ size: CGFloat, weight: Font.Weight = .regular) -> Font {
        .system(size: size, weight: weight, design: .rounded)
    }
}

// MARK: - Button Style
struct PillButtonStyle: ButtonStyle {
    var backgroundColor: Color = DS.accent
    var foregroundColor: Color = .white
    
    func makeBody(configuration: Configuration) -> some View {
        configuration.label
            .font(.rounded(15, weight: .semibold))
            .foregroundColor(foregroundColor)
            .padding(.horizontal, 24)
            .padding(.vertical, 12)
            .background(backgroundColor)
            .clipShape(Capsule())
            .scaleEffect(configuration.isPressed ? 0.96 : 1.0)
            .animation(.spring(response: 0.3, dampingFraction: 0.7), value: configuration.isPressed)
    }
}

struct CardStyle: ViewModifier {
    func body(content: Content) -> some View {
        content
            .background(DS.cardBackground)
            .clipShape(RoundedRectangle(cornerRadius: DS.radiusM))
            .cardShadow()
    }
}

extension View {
    func cardStyle() -> some View {
        modifier(CardStyle())
    }
}

// MARK: - Haptic Feedback
struct HapticFeedback {
    static func light() {
        UIImpactFeedbackGenerator(style: .light).impactOccurred()
    }
    static func medium() {
        UIImpactFeedbackGenerator(style: .medium).impactOccurred()
    }
    static func success() {
        UINotificationFeedbackGenerator().notificationOccurred(.success)
    }
}

// MARK: - Image Cache
class ImageCache {
    static let shared = ImageCache()
    private var cache: NSCache<NSString, UIImage> = {
        let c = NSCache<NSString, UIImage>()
        c.countLimit = 100
        c.totalCostLimit = 50 * 1024 * 1024
        return c
    }()
    
    func get(_ url: String) -> UIImage? {
        cache.object(forKey: url as NSString)
    }
    
    func set(_ image: UIImage, for url: String) {
        cache.setObject(image, forKey: url as NSString)
    }
}
