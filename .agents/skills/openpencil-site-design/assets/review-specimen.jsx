<Frame name="Baseline / Scoped review / Mobile" w={390} h="hug" flex="col" p={designVar('spacing-container')} gap={designVar('spacing-content')} bg={designVar('color-page')}>
  <Text name="Telemetry" w="fill" textAutoResize="height" font="Consolas" size={12} color={designVar('color-text')}>BASELINE / SYNTHETIC REVIEW</Text>
  <Text name="Display" w="fill" textAutoResize="height" font="Arial" size={32} weight={700} color={designVar('color-text')}>Room for useful ideas</Text>
  <Text name="Accent" w="fill" textAutoResize="height" font="Georgia" italic size={22} color={designVar('color-text')}>Made to adapt.</Text>
  <Component name="Review card" w="fill" h="hug" flex="col" p={designVar('spacing-content')} gap={12} rounded={12} bg={designVar('color-surface')} properties={[{id:'title',name:'Title',type:'TEXT',defaultValue:'A short starting title'},{id:'meta',name:'ShowMetadata',type:'BOOLEAN',defaultValue:'true'}]}>
    <Text name="Title" w="fill" textAutoResize="height" font="Arial" weight={700} size={22} color={designVar('color-text')} propertyRefs={[{propertyId:'title',field:'TEXT'}]}>A short starting title</Text>
    <Text name="Metadata" w="fill" textAutoResize="height" font="Consolas" size={14} color={designVar('color-text')} propertyRefs={[{propertyId:'meta',field:'VISIBLE'}]}>26 OCT / 18:30</Text>
    <Text name="Body" w="fill" textAutoResize="height" font="Arial" size={16} color={designVar('color-text')}>A real component with a wrapping title and optional metadata.</Text>
  </Component>
  <Instance name="Review instance" of="Review card" w="fill" Title="A short starting title" ShowMetadata={true} />
  <Frame name="Elevated note" w="fill" h="hug" flex="col" p={designVar('spacing-content')} gap={12} rounded={12} bg={designVar('color-elevated')}>
    <Text name="Note" w="fill" textAutoResize="height" font="Arial" size={16} color={designVar('color-text')}>This lower panel must remain visible after a long-title edit.</Text>
  </Frame>
  <ComponentSet name="Review action" flex="col" gap={12}>
    <Component name="State=Default" w={200} h={48} flex="row" items="center" justify="center" rounded={6} bg={designVar('color-action')}>
      <Text font="Arial" size={16} weight={700} color="#ffffff">Explore the study</Text>
    </Component>
    <Component name="State=Disabled" w={200} h={48} flex="row" items="center" justify="center" rounded={6} bg={designVar('color-elevated')}>
      <Text font="Arial" size={16} color={designVar('color-text')}>Unavailable</Text>
    </Component>
  </ComponentSet>
</Frame>
