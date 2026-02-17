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
                    .shadow(
                        color: isSelected ? color.opacity(0.35) : .black.opacity(0.06),
                        radius: isSelected ? 8 : 4,
                        x: 0, y: 2
                    )
            )
        }
        .buttonStyle(.plain)
    }
}

// MARK: - Quantity Badge
struct QuantityBadge: View {
    let count: Int
    let color: Color
    
    var body: some View {
        Text("\(count)")
            .font(.rounded(13, weight: .bold))
            .foregroundColor(.white)
            .padding(.horizontal, 8)
            .padding(.vertical, 3)
            .background(Capsule().fill(color))
    }
}

// MARK: - Category Badge
struct CategoryBadge: View {
    let emoji: String
    let name: String
    var color: Color = DS.accent
    
    var body: some View {
        HStack(spacing: 4) {
            Text(emoji).font(.system(size: 14))
            Text(name).font(.rounded(13, weight: .medium))
        }
        .foregroundColor(color)
        .padding(.horizontal, 10)
        .padding(.vertical, 5)
        .background(Capsule().fill(color.opacity(0.12)))
    }
}

// MARK: - Empty State View
struct EmptyStateView: View {
    let icon: String
    let title: String
    let subtitle: String
    var action: (() -> Void)? = nil
    var actionTitle: String = "追加する"
    
    var body: some View {
        VStack(spacing: DS.spacingM) {
            Text(icon)
                .font(.system(size: 64))
                .padding(.bottom, DS.spacingS)
            
            Text(title)
                .font(.rounded(20, weight: .bold))
                .foregroundColor(DS.primaryText)
            
            Text(subtitle)
                .font(.rounded(14))
                .foregroundColor(DS.secondaryText)
                .multilineTextAlignment(.center)
                .padding(.horizontal)
            
            if let action = action {
                Button(action: action) {
                    Label(actionTitle, systemImage: "plus")
                }
                .buttonStyle(PillButtonStyle())
                .padding(.top, DS.spacingS)
            }
        }
        .padding(DS.spacingXL)
    }
}

// MARK: - Loading Overlay
struct LoadingOverlay: View {
    var body: some View {
        ZStack {
            Color.black.opacity(0.3)
                .ignoresSafeArea()
            
            RoundedRectangle(cornerRadius: DS.radiusL)
                .fill(.ultraThinMaterial)
                .frame(width: 100, height: 100)
                .overlay(
                    ProgressView()
                        .scaleEffect(1.4)
                        .tint(DS.accent)
                )
                .cardShadow()
        }
    }
}

// MARK: - Section Header
struct SectionHeader: View {
    let title: String
    var count: Int? = nil
    var action: (() -> Void)? = nil
    var actionTitle: String = "すべて見る"
    
    var body: some View {
        HStack {
            Text(title)
                .font(.rounded(18, weight: .bold))
                .foregroundColor(DS.primaryText)
            
            if let count = count {
                Text("\(count)")
                    .font(.rounded(13, weight: .semibold))
                    .foregroundColor(DS.secondaryText)
                    .padding(.horizontal, 8)
                    .padding(.vertical, 2)
                    .background(Capsule().fill(DS.background))
            }
            
            Spacer()
            
            if let action = action {
                Button(action: action) {
                    Text(actionTitle)
                        .font(.rounded(13, weight: .medium))
                        .foregroundColor(DS.accent)
                }
            }
        }
    }
}

// MARK: - Color Picker Grid
struct ColorPickerGrid: View {
    @Binding var selectedHex: String
    let colors: [Color] = Color.kidsPalette
    
    var body: some View {
        LazyVGrid(columns: Array(repeating: GridItem(.flexible(), spacing: 10), count: 6), spacing: 10) {
            ForEach(colors.indices, id: \.self) { index in
                let color = colors[index]
                let hex = color.toHex()
                
                Circle()
                    .fill(color)
                    .frame(width: 40, height: 40)
                    .overlay(
                        Circle()
                            .strokeBorder(
                                selectedHex == hex ? Color.white : Color.clear,
                                lineWidth: 3
                            )
                    )
                    .overlay(
                        Circle()
                            .strokeBorder(
                                selectedHex == hex ? DS.accent : Color.clear,
                                lineWidth: 2
                            )
                            .padding(-2)
                    )
                    .scaleEffect(selectedHex == hex ? 1.15 : 1.0)
                    .onTapGesture {
                        withAnimation(.spring(response: 0.3)) {
                            selectedHex = hex
                        }
                        HapticFeedback.light()
                    }
            }
        }
        .padding(DS.spacingM)
        .background(DS.background)
        .clipShape(RoundedRectangle(cornerRadius: DS.radiusM))
    }
}
