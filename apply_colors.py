import re

def update_file(filepath):
    with open(filepath, 'r', encoding='utf-8') as f:
        content = f.read()

    # Layout changes
    content = content.replace('bg-[#d7dce1]', 'bg-[#F0F2F5]')
    content = content.replace('bg-[#c8cdd4]/95', 'bg-[#132B40]')
    content = content.replace('bg-[#aeb5bf]/95', 'bg-[#132B40]')
    content = content.replace('text-[#243041]', 'text-gray-100')
    content = content.replace('text-[#4e5c70]', 'text-gray-400')
    content = content.replace('bg-[#a0aab8]/60', 'bg-[#0A1A28]')
    content = content.replace('hover:bg-[#bcc4ce]/70', 'hover:bg-[#0A1A28]/50')
    content = content.replace('border-[#b6bcc6]', 'border-[#0F2233]')
    content = content.replace('border-[#b3bbc6]', 'border-[#0F2233]')
    content = content.replace('text-[#1F2937]', 'text-white')
    content = content.replace('bg-[#919dae]', 'bg-[#0A1A28]')
    
    with open(filepath, 'w', encoding='utf-8') as f:
        f.write(content)

update_file('frontend/src/components/layout/SuperAdminLayout.tsx')
update_file('frontend/src/pages/portal/SuperAdminDashboard.tsx')
