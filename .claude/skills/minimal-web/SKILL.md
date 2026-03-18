# 🧠 SKILLS — Frontend Minimalist 3D Developer

## 🎯 Objective

Build modern, high-performance frontend interfaces with a **minimalist aesthetic**, smooth UX, and **next-generation 3D interactions**.

Focus on:

- Clean UI (Apple-like design philosophy)
- Subtle but impactful animations
- Performance-first architecture
- Scalable and maintainable code

---

## 🧩 Core Stack

### 🖥️ Framework

- Next.js (App Router)
- React (Functional + Hooks)

### 🎨 Styling

- TailwindCSS
- CSS Modules (when needed)
- PostCSS

### 🎬 Animation

- Framer Motion (UI transitions)
- GSAP (advanced motion control)

### 🌌 3D & Advanced Visuals

- Three.js
- React Three Fiber (R3F)
- Drei (helpers)

### ⚙️ Utilities

- clsx / tailwind-merge
- Zustand (state management)
- React Hook Form

---

## 🎨 Design Principles

### Minimalism First

- Remove unnecessary elements
- Use whitespace intentionally
- Focus on typography hierarchy

### Color System

- Base: Black & White
- Accent: Soft pastel tones
- Theme support: Light / Dark switch

### Typography

- Sans-serif modern fonts
- Strong contrast between headings and body
- Large readable titles

---

## ✨ Animation Philosophy

### Rules

- Never animate everything
- Prioritize meaningful motion
- Keep animations subtle and fast

### Patterns

- Fade + Slide (default)
- Scale on hover
- Smooth page transitions
- Micro-interactions

---

## 🌌 3D Integration Strategy

### When to Use 3D

- Hero sections
- Background ambient elements
- Interactive showcases

### When NOT to Use

- Forms
- Content-heavy sections
- Performance-critical pages

---

## 🧠 Performance Rules

- Lazy load 3D components
- Use dynamic() in Next.js
- Avoid unnecessary re-renders
- Optimize textures and meshes
- Use useMemo and useFrame properly

---

## 🧱 Folder Structure

```
/src
/app
/components
/ui
/3d
/hooks
/lib
/styles
```

---

## 🧪 Component Patterns

### Clean Component Example

```tsx
export function Button({ children }) {
  return (
    <button className="rounded-xl bg-black px-4 py-2 text-white transition hover:opacity-80">
      {children}{" "}
    </button>
  );
}
```

---

## 🎬 Animation Example (Framer Motion)

```tsx
import { motion } from "framer-motion";

export function FadeIn({ children }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.6 }}
    >
      {children}
    </motion.div>
  );
}
```

---

## 🌌 3D Example (React Three Fiber)

```tsx
import { Canvas } from "@react-three/fiber";
import { OrbitControls } from "@react-three/drei";

export default function Scene() {
  return (
    <Canvas>
      <ambientLight intensity={0.5} />
      <mesh>
        <boxGeometry />
        <meshStandardMaterial color="white" />
      </mesh>
      <OrbitControls />
    </Canvas>
  );
}
```

---

## 🧠 UX Principles

- Fast loading always > visual effects
- User should never feel lost
- Clear navigation hierarchy
- Interactive but not overwhelming

---

## 🔄 Theme System

- Use Tailwind dark: classes
- Toggle via context or Zustand
- Persist with localStorage

---

## 🚀 Best Practices

- Mobile-first development
- Accessibility (ARIA, contrast)
- Reusable components
- Clean naming conventions

---

## 🧠 Mental Model

> "Design should feel invisible.
> Animation should feel natural.
> Performance should feel instant."

---

## 📌 Future Enhancements

- WebGL shaders
- Scroll-based 3D storytelling
- AI-driven UI interactions
- Advanced motion systems

---

## 🧩 Usage (AI / Prompt Engineering)

Use this file as a reference to:

- Generate UI designs
- Guide frontend architecture
- Maintain consistency across projects
- Train AI agents for UI generation

---

## 🔚 Summary

This skillset focuses on building:

- Minimalist interfaces
- Smooth animations
- Modern 3D experiences
- High-performance web applications
