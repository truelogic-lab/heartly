path = 'src/engine/services/SafetyService.js'
with open(path) as f:
    src = f.read()

old = """    const record = await this.blocks.add(this.engine.prepareBlock({ viewerId, targetId }));

    // Mark any existing match as blocked
    const match = await this.matches.findBetween(viewerId, targetId);
    if (match) await this.matches.update(match.id, { blocked: true });

    this.events?.publish(record.event);
    return record;
  }"""

new = """    const payload = this.engine.prepareBlock({ viewerId, targetId });

    // Persist the block record (repository returns only the stored shape)
    const record = await this.blocks.add({
      blockerId: payload.blockerId,
      blockedId: payload.blockedId,
    });

    // Mark any existing match as blocked
    const match = await this.matches.findBetween(viewerId, targetId);
    if (match) await this.matches.update(match.id, { blocked: true });

    this.events?.publish(payload.event);
    return record;
  }"""

if old in src:
    src = src.replace(old, new)
    with open(path, 'w') as f:
        f.write(src)
    print('✔ SafetyService.block fixed')
else:
    print('⚠ Pattern not found — inspect SafetyService.js')
