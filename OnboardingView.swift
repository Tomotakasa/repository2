import SwiftUI

struct OnboardingView: View {
    @EnvironmentObject var authManager: AuthManager
    @State private var currentPage = 0
    @State private var showSignIn = false
    
    let pages: [OnboardingPage] = [
        OnboardingPage(
            emoji: "👕",
            title: "こどものクローゼットを\nスッキリ整理",
            subtitle: "1歳・3歳のお子さまの服や持ち物を\nスマートに管理しましょう",
            gradientColors: [Color(hex: "#FF8FAB") ?? .pink, Color(hex: "#FFD3E0") ?? .pink.opacity(0.5)]
        ),
        OnboardingPage(
            emoji: "👨‍👩‍👧",
            title: "家族みんなで\nリアルタイム共有",
            subtitle: "パパもママも同じ画面を見て\n「これ持ってたっけ？」をなくす",
            gradientColors: [Color(hex: "#74B9FF") ?? .blue, Color(hex: "#D6EAFF") ?? .blue.opacity(0.5)]
        ),
        OnboardingPage(
            emoji: "📸",
            title: "写真付きで\n一目でわかる",
            subtitle: "子供ごとに色分け表示。\n誰の服か迷わない",
            gradientColors: [Color(hex: "#55EFC4") ?? .green, Color(hex: "#D4F5EC") ?? .green.opacity(0.5)]
        )
    ]
    
    var body: some View {
        ZStack {
            LinearGradient(
                colors: pages[currentPage].gradientColors.map { $0.opacity(0.15) },
                startPoint: .topLeading,
                endPoint: .bottomTrailing
            )
            .ignoresSafeArea()
            .animation(.easeInOut(duration: 0.5), value: currentPage)
            
            VStack(spacing: 0) {
                TabView(selection: $currentPage) {
                    ForEach(pages.indices, id: \.self) { index in
                        OnboardingPageView(page: pages[index])
                            .tag(index)
                    }
                }
                .tabViewStyle(.page(indexDisplayMode: .never))
                .frame(maxHeight: .infinity)
                
                HStack(spacing: 8) {
                    ForEach(pages.indices, id: \.self) { index in
                        Capsule()
                            .fill(currentPage == index ? DS.accent : DS.accent.opacity(0.25))
                            .frame(width: currentPage == index ? 24 : 8, height: 8)
                            .animation(.spring(response: 0.3), value: currentPage)
                    }
                }
                .padding(.bottom, DS.spacingL)
                
                VStack(spacing: DS.spacingM) {
                    Button {
                        Task { await authManager.signInWithGoogle() }
                    } label: {
                        HStack(spacing: DS.spacingS) {
                            Image(systemName: "g.circle.fill")
                                .font(.system(size: 20))
                            Text("Googleでサインイン")
                                .font(.rounded(16, weight: .semibold))
                        }
                        .foregroundColor(.white)
                        .frame(maxWidth: .infinity)
                        .frame(height: 54)
                        .background(DS.accent)
                        .clipShape(RoundedRectangle(cornerRadius: DS.radiusL))
                    }
                    
                    Button {
                        Task { await authManager.signInAnonymously() }
                    } label: {
                        Text("まずは試してみる")
                            .font(.rounded(15, weight: .medium))
                            .foregroundColor(DS.secondaryText)
                            .frame(maxWidth: .infinity)
                            .frame(height: 44)
                    }
                }
                .padding(.horizontal, DS.spacingL)
                .padding(.bottom, DS.spacingXL)
            }
        }
        .overlay {
            if authManager.isLoading {
                LoadingOverlay()
            }
        }
    }
}

struct OnboardingPage {
    let emoji: String
    let title: String
    let subtitle: String
    let gradientColors: [Color]
}

struct OnboardingPageView: View {
    let page: OnboardingPage
    @State private var appear = false
    
    var body: some View {
        VStack(spacing: DS.spacingL) {
            Spacer()
            
            ZStack {
                Circle()
                    .fill(
                        LinearGradient(
                            colors: page.gradientColors,
                            startPoint: .topLeading,
                            endPoint: .bottomTrailing
                        )
                    )
                    .frame(width: 160, height: 160)
                    .scaleEffect(appear ? 1.0 : 0.7)
                    .opacity(appear ? 1.0 : 0.0)
                
                Text(page.emoji)
                    .font(.system(size: 72))
                    .scaleEffect(appear ? 1.0 : 0.5)
                    .opacity(appear ? 1.0 : 0.0)
            }
            
            VStack(spacing: DS.spacingM) {
                Text(page.title)
                    .font(.rounded(28, weight: .bold))
                    .foregroundColor(DS.primaryText)
                    .multilineTextAlignment(.center)
                    .offset(y: appear ? 0 : 20)
                    .opacity(appear ? 1.0 : 0.0)
                
                Text(page.subtitle)
                    .font(.rounded(16))
                    .foregroundColor(DS.secondaryText)
                    .multilineTextAlignment(.center)
                    .offset(y: appear ? 0 : 20)
                    .opacity(appear ? 1.0 : 0.0)
                    .padding(.horizontal)
            }
            
            Spacer()
        }
        .onAppear {
            withAnimation(.spring(response: 0.6, dampingFraction: 0.8).delay(0.1)) {
                appear = true
            }
        }
        .onDisappear { appear = false }
    }
}
