import SwiftUI

struct HomeView: View {
    @EnvironmentObject var firestoreService: FirestoreService
    @EnvironmentObject var appState: AppState
    @State private var selectedChildId: String? = nil
    @State private var selectedCategoryId: String? = nil
    
    var summaries: [CategorySummary] {
        var filter = FilterState()
        filter.selectedChildId = selectedChildId
        return firestoreService.categorySummaries(filter: filter)
    }
    
    var totalItems: Int {
        summaries.reduce(0) { $0 + $1.totalQuantity }
    }
    
    var body: some View {
        NavigationStack {
            ScrollView {
                VStack(spacing: DS.spacingL) {
                    HeroHeaderView(
                        totalItems: totalItems,
                        childCount: firestoreService.children.count
                    )
                    
                    ChildSelectorTabs(
                        children: firestoreService.children,
                        selectedChildId: $selectedChildId
                    )
                    
                    if summaries.isEmpty {
                        EmptyStateView(
                            icon: "👗",
                            title: "まだアイテムがありません",
                            subtitle: "＋ボタンからお子さまの服や\n持ち物を登録してみましょう",
                            action: { appState.showingAddItem = true }
                        )
                        .padding(.top, DS.spacingXL)
                    } else {
                        CategoryGridSection(
                            summaries: summaries,
                            children: firestoreService.children,
                            selectedChildId: selectedChildId,
                            onCategoryTap: { summary in
                                selectedCategoryId = summary.categoryId
                            }
                        )
                    }
                    
                    Spacer(minLength: 100)
                }
            }
            .background(DS.background.ignoresSafeArea())
            .navigationBarHidden(true)
            .navigationDestination(item: $selectedCategoryId) { categoryId in
                CategoryDetailView(
                    categoryId: categoryId,
                    preselectedChildId: selectedChildId
                )
                .environmentObject(firestoreService)
            }
        }
    }
}

struct HeroHeaderView: View {
    let totalItems: Int
    let childCount: Int
    
    var body: some View {
        ZStack(alignment: .bottomLeading) {
            LinearGradient(
                colors: [DS.accent, Color(hex: "#A29BFE") ?? DS.accentLight],
                startPoint: .topLeading,
                endPoint: .bottomTrailing
            )
            .clipShape(RoundedRectangle(cornerRadius: DS.radiusXL))
            .padding(.horizontal, DS.spacingM)
            
            VStack(alignment: .leading, spacing: DS.spacingS) {
                HStack {
                    VStack(alignment: .leading, spacing: 4) {
                        Text("こどもクローゼット")
                            .font(.rounded(13, weight: .semibold))
                            .foregroundColor(.white.opacity(0.8))
                        
                        Text("きょうの在庫")
                            .font(.rounded(24, weight: .bold))
                            .foregroundColor(.white)
                    }
                    
                    Spacer()
                    
                    VStack(spacing: 2) {
                        Text("\(totalItems)")
                            .font(.rounded(32, weight: .bold))
                            .foregroundColor(.white)
                        Text("アイテム")
                            .font(.rounded(12))
                            .foregroundColor(.white.opacity(0.8))
                    }
                    .padding(DS.spacingM)
                    .background(Circle().fill(.white.opacity(0.2)))
                }
                
                HStack(spacing: DS.spacingM) {
                    ForEach(["👕", "👖", "🧦", "🧢"], id: \.self) { emoji in
                        Text(emoji)
                            .font(.system(size: 24))
                    }
                }
                .padding(.bottom, DS.spacingS)
            }
            .padding(DS.spacingL)
        }
        .frame(height: 150)
        .padding(.horizontal, DS.spacingM)
        .padding(.top, DS.spacingM)
    }
}

struct CategoryGridSection: View {
    let summaries: [CategorySummary]
    let children: [Child]
    let selectedChildId: String?
    let onCategoryTap: (CategorySummary) -> Void
    
    let columns = [
        GridItem(.flexible(), spacing: DS.spacingM),
        GridItem(.flexible(), spacing: DS.spacingM)
    ]
    
    var body: some View {
        VStack(spacing: DS.spacingM) {
            SectionHeader(
                title: "カテゴリ別",
                count: summaries.count
            )
            .padding(.horizontal, DS.spacingM)
            
            LazyVGrid(columns: columns, spacing: DS.spacingM) {
                ForEach(summaries) { summary in
                    CategoryCard(
                        summary: summary,
                        accentColor: childColor(for: selectedChildId, children: children)
                    )
                    .onTapGesture {
                        HapticFeedback.light()
                        onCategoryTap(summary)
                    }
                }
            }
            .padding(.horizontal, DS.spacingM)
        }
    }
    
    func childColor(for childId: String?, children: [Child]) -> Color {
        guard let id = childId,
              let child = children.first(where: { $0.id == id }) else {
            return DS.accent
        }
        return child.color
    }
}

struct CategoryCard: View {
    let summary: CategorySummary
    var accentColor: Color = DS.accent
    @State private var appear = false
    
    var body: some View {
        VStack(alignment: .leading, spacing: DS.spacingS) {
            HStack {
                Text(summary.categoryEmoji)
                    .font(.system(size: 32))
                
                Spacer()
                
                VStack(alignment: .trailing, spacing: 2) {
                    Text("\(summary.totalQuantity)")
                        .font(.rounded(26, weight: .bold))
                        .foregroundColor(accentColor)
                    Text("点")
                        .font(.rounded(11))
                        .foregroundColor(DS.secondaryText)
                }
            }
            
            Text(summary.categoryName)
                .font(.rounded(15, weight: .semibold))
                .foregroundColor(DS.primaryText)
            
            Text("\(summary.itemCount)種類")
                .font(.rounded(12))
                .foregroundColor(DS.secondaryText)
            
            if !summary.items.isEmpty {
                ScrollView(.horizontal, showsIndicators: false) {
                    HStack(spacing: -8) {
                        ForEach(summary.items.prefix(4)) { item in
                            CachedAsyncImage(url: item.imageURL, size: 28, cornerRadius: 6)
                                .overlay(
                                    RoundedRectangle(cornerRadius: 6)
                                        .strokeBorder(.white, lineWidth: 1.5)
                                )
                        }
                        if summary.items.count > 4 {
                            Text("+\(summary.items.count - 4)")
                                .font(.rounded(10, weight: .bold))
                                .foregroundColor(.white)
                                .frame(width: 28, height: 28)
                                .background(Capsule().fill(accentColor))
                        }
                    }
                }
            }
        }
        .padding(DS.spacingM)
        .background(DS.cardBackground)
        .clipShape(RoundedRectangle(cornerRadius: DS.radiusL))
        .overlay(
            RoundedRectangle(cornerRadius: DS.radiusL)
                .strokeBorder(accentColor.opacity(0.12), lineWidth: 1)
        )
        .cardShadow()
        .scaleEffect(appear ? 1.0 : 0.92)
        .opacity(appear ? 1.0 : 0.0)
        .onAppear {
            withAnimation(.spring(response: 0.5, dampingFraction: 0.8)) {
                appear = true
            }
        }
    }
}

extension String: @retroactive Identifiable {
    public var id: String { self }
}
