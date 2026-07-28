import sys

filename = 'src/components/admin/BookingDetailsView.tsx'

with open(filename, 'r') as f:
    lines = f.readlines()

# Extract lines 554 to 695 (0-indexed, so 555-696)
start_idx = 554
end_idx = 696

function_lines = lines[start_idx:end_idx]

# Remove indentation from function lines
formatted_lines = []
for line in function_lines:
    if line.startswith('    '):
        formatted_lines.append(line[4:])
    else:
        formatted_lines.append(line)

# Add export keyword
formatted_lines[0] = 'export ' + formatted_lines[0]

# Delete from original location
del lines[start_idx:end_idx]

# Append to the end
lines.append('\n')
lines.extend(formatted_lines)

with open(filename, 'w') as f:
    f.writelines(lines)

print("Moved function successfully!")
