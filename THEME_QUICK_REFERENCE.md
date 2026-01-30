# Frontend Theme - Quick Reference Card

## Color System
```
Primary Navy:        #00356B  (Headings, Badges, Accents)
CTA Orange:          #D85C2C  (Primary Buttons, CTAs)
CTA Hover:           #b84520  (Button Hover State)
Electric Green:      #86bc25  (Secondary Accents)
White:               #ffffff
Off-White:           #f8f9fa
Light Blue:          #eef5ff
Dark Gray:           #1a1a1a
Mid Gray:            #666666
```

## Typography Stack
```
Primary:   Plus Jakarta Sans
Secondary: Nunito

Weights:
- 300: font-light      (Headers)
- 400: font-normal     (Body)
- 500: font-medium     (Body emphasis)
- 600: font-semibold   (Secondary)
- 700: font-bold       (Emphasis)
- 900: font-black      (Buttons)
```

## Heading Pattern
```tsx
<h1 className="text-3xl font-light text-[#00356B] tracking-tight">
  Main <span className="font-bold">Title</span>
</h1>
<p className="text-gray-600 text-[13px] font-medium">Subtitle</p>
```

## Button Patterns

### Primary CTA
```tsx
<button className="bg-[#D85C2C] text-white px-6 py-3 text-[10px] font-black uppercase tracking-[1.5px] rounded-md hover:bg-[#b84520] transition-colors shadow-sm">
  Action
</button>
```

### Secondary Button
```tsx
<button className="border border-[#00356B] text-[#00356B] px-6 py-3 text-[10px] font-black uppercase tracking-[1.5px] rounded-md hover:bg-[#00356B] hover:text-white transition-colors">
  Action
</button>
```

## Badge Pattern
```tsx
<Badge className="bg-[#00356B] text-white text-[10px] font-bold uppercase tracking-tight">
  Label
</Badge>
```

## Card Pattern
```tsx
<div className="bg-white shadow-lg rounded-xl p-6 border border-gray-200">
  Content
</div>
```

## Section Background
```tsx
<div className="bg-[#eef5ff]">
  Content
</div>
```

## Gradient Patterns

### Navy to Orange
```tsx
className="bg-gradient-to-r from-[#00356B]/10 to-[#D85C2C]/10"
```

### Navy to Navy
```tsx
className="bg-gradient-to-r from-[#00356B]/5 via-[#D85C2C]/5 to-[#00356B]/5"
```

## Loader/Spinner
```tsx
<Loader2 className="w-8 h-8 animate-spin mx-auto text-[#00356B]" />
```

## Files Using Theme
- ✅ ManagerPortal.tsx
- ✅ TenantDashboard.tsx
- ✅ ProfileManagement.tsx
- ✅ PaymentsManagement.tsx
- ✅ SettingsManagement.tsx
- ✅ PropertiesManagement.tsx
- ✅ manager/Payments.tsx
- ✅ manager/Properties.tsx

## Spacing Standards
```
- Padding: px-6 py-3 (buttons)
- Padding: p-6 (cards)
- Gap: gap-4 (between elements)
- Rounded: rounded-md (buttons), rounded-xl (cards)
```

## Text Sizing Standards
```
- Headings: text-3xl
- Subheadings: text-xl or text-lg
- Descriptions: text-[13px]
- Button text: text-[10px]
- Badge text: text-[10px] or text-[9px]
```

## Transitions
```
hover:transition-colors
hover:duration-300
hover:ease-in-out
```

---

**Last Updated:** January 16, 2025
**Theme Version:** 1.0
**Status:** Production Ready
