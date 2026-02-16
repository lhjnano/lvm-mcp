# @purpleraven/server-lvm

MCP server for managing LVM (Logical Volume Manager) on Linux systems.

## Installation

### NPM (Recommended)

```bash
npx -y @purpleraven/server-lvm
```

### Local Development

```bash
git clone https://github.com/lhjnano/lvm-mcp.git
cd lvm-mcp
npm install
npm run build
npm start
```

## Usage

### MCP Client Configuration

Add to your MCP client config:

```json
{
  "mcpServers": {
    "lvm": {
      "type": "local",
      "command": ["npx", "-y", "@purpleraven/server-lvm"]
    }
  }
}
```

## Available Tools

### Physical Volume (PV)
- `lvm_pvcreate` - Create Physical Volume
- `lvm_pvdisplay` - Display PV information
- `lvm_pvs` - List all Physical Volumes
- `lvm_pvremove` - Remove Physical Volume

### Volume Group (VG)
- `lvm_vgcreate` - Create Volume Group
- `lvm_vgextend` - Extend Volume Group
- `lvm_vgdisplay` - Display VG information
- `lvm_vgs` - List all Volume Groups
- `lvm_vgremove` - Remove Volume Group

### Logical Volume (LV)
- `lvm_lvcreate` - Create Logical Volume (linear, striped, mirror, RAID, thin)
- `lvm_lvextend` - Extend LV with optional filesystem resize
- `lvm_lvreduce` - Reduce LV with optional filesystem resize
- `lvm_lvremove` - Remove Logical Volume
- `lvm_lvchange` - Change LV attributes
- `lvm_lvdisplay` - Display LV information
- `lvm_lvs` - List all Logical Volumes

### Advanced Features
- `lvm_cache_create` - Attach cache (dm-cache/writecache)
- `lvm_splitcache` - Split cache from LV
- `lvm_raidscrub` - RAID consistency check/scrub
- `lvm_setraidrecoveryrate` - Set RAID recovery rate
- `lvm_snapshot_create` - Create snapshot
- `lvm_listsnapshots` - List all snapshots
- `lvm_removesnapshot` - Remove snapshot
- `lvm_thinpool_create` - Create thin pool

### Configuration
- `lvm_conf_read` - Read LVM configuration
- `lvm_conf_write` - Write LVM configuration

## Requirements

- Linux with LVM 2.x
- Root or sudo privileges
- Node.js 18+

## Development

```bash
npm install
npm run build
npm test
```

## License

MIT
