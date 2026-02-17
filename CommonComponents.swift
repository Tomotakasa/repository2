import SwiftUI

// MARK: - Async Image Loader
struct CachedAsyncImage: View {
    let url: String?
    var size: CGFloat = 80
    var cornerRadius: CGFloat = 12
    
    @State private var image: UIImage?
    @State private var isLoading = false
    
    var body: some View {
        Group {
            if let image = image {
                Image(uiImage: image)
                    .resizable()
                    .aspectRatio(contentMode: .fill)
                    .frame(width: size, height: size)
                    .clipShape(RoundedRectangle(cornerRadius: cornerRadius))
            } else if isLoading {
                RoundedRectangle(cornerRadius: cornerRadius)
                    .fill(Color.gray.opacity(0.1))
                    .frame(width: size, height: size)
                    .overlay(ProgressView().scaleEffect(0.8))
            } else {
                RoundedRectangle(cornerRadius: cornerRadius)
                    .fill(
                        LinearGradient(
                            colors: [Color(hex: "#F8F9FA") ?? .gray.opacity(0.1),
                                     Color(hex: "#E9ECEF") ?? .gray.opacity(0.2)],
                            startPoint: .topLeading,
                            endPoint: .bottomTrailing
                        )
                    )
                    .frame(width: size, height: size)
                    .overlay(
                        Image(systemName: "photo")
                            .font(.system(size: size * 0.3))
                            .foregroundColor(.gray.opacity(0.4))
                    )
            }
        }
        .task(id: url) {
            await loadImage()
        }
    }
    
    private func loadImage() async {
        guard let urlString = url, !urlString.isEmpty else { return }
        
        if let cached = ImageCache.shared.get(urlString) {
            image = cached
            return
        }
        
        isLoading = true
        defer { isLoading = false }
        
        guard let url = URL(string: urlString),
              let (data, _) = try? await URLSession.shared.data(from: url),
              let loaded = UIImage(data: data) else { return }
        
        ImageCache.shared.set(loaded, for: urlString)
        image = loaded
    }
}

// MARK: - Child Selector Tabs
struct ChildSelectorTabs: View {
    let children: [Child]
    @Binding var selectedChildId: String?
    
    var body: some View {
        ScrollView(.horizontal, showsIndicators: false) {
            HStack(spacing: DS.spacingS) {
                ChildTab(
                    name: "みんな",
                    emoji: "👨‍👩‍👧‍👦",
                    color: DS.accent,
                    isSelected: selectedChildId == nil,
                    action: {
                        withAnimation(.spring(response: 0.3)) {
                            selectedChildId = nil
                        }
                        HapticFeedback.light()
                    }
                )
                
                ForEach(children) { child in
                    ChildTab(
                        name: child.name,
                        emoji: child.emoji,
                        color: child.color,
                        isSelected: selectedChildId == child.id,
                        action: {
                            withAnimation(.spring(response: 0.3)) {
                                selectedChildId = child.id
                            }
                            HapticFeedback.light()
                        }
                    )
                }
            }
            .padding(.horizontal, DS.spacingM)
        }
    }
}

struct ChildTab: View {
    let name: String
    let emoji: String
    let color: Color
    let isSelected: Bool
    let action: () -> Void
    
    var body: some View {
        Button(action: action) {
            HStack(spacing: 6) {
                Text(emoji)
                    .font(.system(size: 16))
                Text(name)
                    .font(.rounded(14, weight: isSelected ? .bold : .medium))
            }
            .foregroundColor(isSelected ? .white : DS.primaryText)
            .padding(.horizontal, 14)
            .padding(.vertical, 8)
            .background(
                Capsule()
                    .fill(isSelected ? color : Color.white)
                    .shadow(​​​​​​​​​​​​​​​​
