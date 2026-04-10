import { Boxes, LayoutDashboard, MessageSquare, Settings2, TerminalSquare } from "lucide-react";
import { NavLink, Outlet } from "react-router-dom";
import { cn } from "../lib/cn";

const navItems = [
  { to: "/overview", label: "概览", icon: LayoutDashboard },
  { to: "/models", label: "模型配置", icon: Settings2 },
  { to: "/channels", label: "消息渠道", icon: MessageSquare },
  { to: "/logs", label: "运行日志", icon: TerminalSquare }
] as const;

export function AppShell() {
  return (
    <div className="min-h-screen bg-surface text-ink">
      <div className="flex min-h-screen">
        <aside className="hidden w-[248px] shrink-0 border-r border-line bg-white px-5 py-6 lg:block">
          <div className="mb-10 flex items-center gap-3">
            <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-gradient-to-br from-brand-500 to-brand-700 text-white shadow-soft">
              <Boxes size={22} />
            </div>
            <div>
              <div className="text-lg font-semibold">OpenClaw</div>
              <div className="text-sm text-slate-500">智能体控制台</div>
            </div>
          </div>

          <nav className="space-y-2">
            {navItems.map((item) => {
              const Icon = item.icon;
              return (
                <NavLink
                  key={item.to}
                  to={item.to}
                  className={({ isActive }) =>
                    cn(
                      "flex items-center gap-3 rounded-2xl px-4 py-3 text-sm font-medium transition",
                      isActive ? "bg-brand-50 text-brand-600" : "text-slate-600 hover:bg-slate-50"
                    )
                  }
                >
                  <Icon size={18} />
                  {item.label}
                </NavLink>
              );
            })}
          </nav>
        </aside>

        <div className="flex-1">
          <div className="mx-auto w-full max-w-[1560px] px-5 py-5 md:px-8">
            <div className="mb-4 flex gap-2 overflow-x-auto lg:hidden">
              {navItems.map((item) => {
                const Icon = item.icon;
                return (
                  <NavLink
                    key={item.to}
                    to={item.to}
                    className={({ isActive }) =>
                      cn(
                        "inline-flex shrink-0 items-center gap-2 rounded-full border px-4 py-2.5 text-sm font-medium",
                        isActive
                          ? "border-brand-100 bg-brand-50 text-brand-600"
                          : "border-line bg-white text-slate-600"
                      )
                    }
                  >
                    <Icon size={16} />
                    {item.label}
                  </NavLink>
                );
              })}
            </div>
            <div className="mb-6 flex items-center justify-end">
              <button className="flex h-11 w-11 items-center justify-center rounded-2xl border border-line bg-white text-slate-500 shadow-sm transition hover:text-brand-600">
                <Settings2 size={18} />
              </button>
            </div>
            <Outlet />
          </div>
        </div>
      </div>
    </div>
  );
}
