export default function SemanticRoleProbe() {
  return (
<div style={{position: 'relative', width: '390px', height: '270px'}}>
  <style>
:root &#123;
  --color-action: #005198;
  --color-border: #c8ced8;
  --color-page: #fafcfe;
  --color-surface: #ffffff;
  --color-text: #1a2029;
&#125;
</style>
  <div style={{position: 'absolute', left: '0px', top: '0px', width: '390px', height: '270px', boxSizing: 'border-box', backgroundColor: 'var(--color-page)', display: 'flex', flexDirection: 'column', gap: '12px', padding: '24px'}}>
    <div style={{alignSelf: 'stretch', width: 'auto', boxSizing: 'border-box', fontSize: '40px', fontFamily: '\'Arial\', system-ui, sans-serif', fontWeight: '700', textAlign: 'left', color: 'var(--color-text)', whiteSpace: 'pre-wrap', overflowWrap: 'break-word'}}>Build with Baseline</div>
    <div style={{alignSelf: 'stretch', width: 'auto', boxSizing: 'border-box', backgroundColor: 'var(--color-surface)', borderRadius: '12px', display: 'flex', flexDirection: 'column', gap: '12px', padding: '24px'}}>
      <div style={{alignSelf: 'stretch', width: 'auto', boxSizing: 'border-box', fontSize: '18px', fontFamily: '\'Arial\', system-ui, sans-serif', textAlign: 'left', color: 'var(--color-text)', whiteSpace: 'pre-wrap', overflowWrap: 'break-word'}}>Five named semantic colours</div>
      <div style={{alignSelf: 'stretch', width: 'auto', height: '1px', boxSizing: 'border-box', backgroundColor: 'var(--color-border)'}}></div>
      <div style={{alignSelf: 'stretch', width: 'auto', height: '24px', boxSizing: 'border-box', backgroundColor: 'var(--color-action)'}}></div>
    </div>
  </div>
</div>
  );
}
