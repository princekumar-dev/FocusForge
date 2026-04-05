import { SignUp } from '@clerk/clerk-react';
import { Target } from 'lucide-react';

export default function SignUpPage() {
  return (
    <div className="min-h-screen flex flex-col items-center justify-center p-6 relative overflow-hidden">
      <div className="absolute top-1/4 left-1/2 -translate-x-1/2 -translate-y-1/2 opacity-[0.03] pointer-events-none">
        <Target className="w-[80vw] h-[80vw] text-primary" />
      </div>

      <div className="mb-8 text-center space-y-2 relative z-10 transition-transform hover:scale-105 duration-500">
        <div className="w-16 h-16 bg-primary/10 rounded-[1.5rem] flex items-center justify-center mx-auto mb-4 glass border-white/20 shadow-2xl">
          <Target className="w-8 h-8 text-primary" />
        </div>
        <h1 className="text-4xl font-extrabold tracking-tight text-foreground drop-shadow-sm">FocusForge</h1>
        <p className="text-[10px] font-black uppercase tracking-[0.3em] text-muted-foreground/60">Join the Elite Collective</p>
      </div>

      <div className="glass p-1 rounded-[2.5rem] shadow-3xl border-white/20 relative z-10">
        <SignUp
          path="/sign-up"
          routing="path"
          signInUrl="/sign-in"
          fallbackRedirectUrl="/"
          appearance={{
            elements: {
              card: "bg-transparent shadow-none border-none",
              headerTitle: "text-foreground font-black tracking-tight",
              headerSubtitle: "text-muted-foreground font-medium",
              socialButtonsBlockButton: "glass border-white/10 hover:bg-white/5 transition-all rounded-xl",
              formButtonPrimary: "bg-primary hover:bg-primary/90 text-primary-foreground font-black uppercase tracking-widest rounded-xl py-3 shadow-xl",
              footerActionLink: "text-primary font-bold hover:text-primary/80",
              formFieldLabel: "text-[10px] font-black uppercase tracking-widest text-muted-foreground/70",
              formFieldInput: "glass border-white/10 rounded-xl focus:border-primary/50",
              dividerLine: "bg-white/10",
              dividerText: "text-[10px] font-black uppercase tracking-widest text-muted-foreground/40",
            }
          }}
        />
      </div>

      <p className="mt-8 text-[10px] font-black uppercase tracking-widest text-muted-foreground/30 relative z-10">
        Tactical Enrollment Terminal v4.0.5
      </p>
    </div>
  );
}
