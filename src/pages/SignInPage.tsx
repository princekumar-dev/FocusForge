import { SignIn } from '@clerk/clerk-react';
import { Target } from 'lucide-react';
import { dark } from '@clerk/themes';
import { useTheme } from 'next-themes';

export default function SignInPage() {
  const { theme } = useTheme();
  const isDark = theme === 'dark';
  return (
    <div className="min-h-[100dvh] flex flex-col items-center justify-center p-6 relative overflow-hidden">
      <div className="absolute top-1/4 left-1/2 -translate-x-1/2 -translate-y-1/2 opacity-[0.03] pointer-events-none">
        <Target className="w-[80vw] h-[80vw] text-primary" />
      </div>

      <div className="mb-8 text-center space-y-2 relative z-10 transition-transform hover:scale-105 duration-500">
        <div className="w-16 h-16 bg-primary/10 rounded-[1.5rem] flex items-center justify-center mx-auto mb-4 glass border-white/20 shadow-2xl">
          <Target className="w-8 h-8 text-primary" />
        </div>
        <h1 className="text-4xl font-extrabold tracking-tight text-foreground drop-shadow-sm">FocusForge</h1>
        <p className="text-[10px] font-black uppercase tracking-[0.3em] text-muted-foreground/60">Tactical Productivity Hub</p>
      </div>

      <div className="glass p-1 rounded-[2.5rem] shadow-3xl border-white/20 relative z-10">
        <SignIn
          path="/sign-in"
          routing="path"
          signUpUrl="/sign-up"
          fallbackRedirectUrl="/"
          appearance={{
            baseTheme: isDark ? dark : undefined,
            elements: {
              card: "bg-transparent shadow-none border-none",
              headerTitle: "text-foreground font-black tracking-tight",
              headerSubtitle: "text-muted-foreground font-medium",
              main: "overflow-visible",
              socialButtonsBlock: "overflow-visible",
              socialButtonsBlockButton: "glass border-white/10 hover:bg-white/5 transition-all rounded-xl relative overflow-visible",
              formButtonPrimary: "bg-primary hover:bg-primary/90 text-primary-foreground font-black uppercase tracking-widest rounded-xl py-3 shadow-xl",
              footerActionLink: "text-primary font-bold hover:text-primary/80",
              formFieldLabel: "text-[10px] font-black uppercase tracking-widest text-muted-foreground/70",
              formFieldInput: "glass border-white/10 rounded-xl focus:border-primary/50",
              dividerLine: "bg-white/10",
              dividerText: "text-[10px] font-black uppercase tracking-widest text-muted-foreground/40",
              footer: "bg-transparent",
              clerkBranding: "hidden",
              identityPreviewText: "text-foreground",
              identityPreviewEditButtonIcon: "text-primary",
              formResendCodeLink: "text-primary",
              socialButtonsBlockButtonBadge: "absolute top-0 right-3 -translate-y-1/2 bg-primary text-primary-foreground text-[7px] font-black uppercase tracking-widest px-2 py-0.5 rounded-full border-none shadow-xl z-50",
            }
          }}
        />
      </div>

      <p className="mt-8 text-[10px] font-black uppercase tracking-widest text-muted-foreground/30 relative z-10">
        Secure Auth Protocol v4.0.5
      </p>
    </div>
  );
}
