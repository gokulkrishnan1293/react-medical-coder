# Narrated mix: Kokoro voice lines at their timing.json starts, music ducked underneath, soft UI clicks and key ticks.
import json,subprocess,os
FF='/usr/local/lib/python3.11/dist-packages/imageio_ffmpeg/binaries/ffmpeg-linux-x86_64-v7.0.2'
A=os.path.expanduser('~/.claude/skills/brag/assets')
tm=json.load(open('timing.json')); cues=json.load(open('cues.json')); END=tm['end']; N=len(tm['vo'])
clicks=[c[0] for c in cues if c[1]=='click']; keys=[c[0] for c in cues if c[1]=='key']
ins=['-i',f'{A}/music/happy-beats-business-moves-vol-9-by-ende-dot-app.mp3','-i',f'{A}/sfx/ui/click2.ogg','-i',f'{A}/sfx/interface/click_003.ogg']
for i in range(N): ins+=['-i',f'vo/l{i:02d}.wav']
f=[f"[0:a]atrim=0:{END},asetpts=N/SR/TB,afade=t=in:d=0.05,afade=t=out:st={END-2.0}:d=2.0,volume=0.10[m]"]
def bank(inp,times,vol,tag):
    n=len(times)
    f.append(f"[{inp}:a]aformat=sample_rates=48000:channel_layouts=stereo,lowpass=f=7000,volume={vol},asplit={n}"+''.join(f'[{tag}{i}]' for i in range(n)))
    for i,t in enumerate(times): f.append(f"[{tag}{i}]adelay={int(t*1000)}|{int(t*1000)}[{tag}d{i}]")
    f.append(''.join(f'[{tag}d{i}]' for i in range(n))+f"amix=inputs={n}:normalize=0[{tag}]")
bank(1,clicks,0.2,'c'); bank(2,keys,0.1,'k')
for i in range(N):
    ms=int(tm['vo'][i]*1000); f.append(f"[{3+i}:a]aformat=sample_rates=48000:channel_layouts=stereo,adelay={ms}|{ms}[v{i}]")
f.append(''.join(f'[v{i}]' for i in range(N))+f"amix=inputs={N}:normalize=0,highpass=f=70,acompressor=threshold=0.2:ratio=3:attack=5:release=120[vo]")
f.append(f"[c][k]amix=inputs=2:normalize=0[sfx];[m][sfx][vo]amix=inputs=3:normalize=0,apad,atrim=0:{END},loudnorm=I=-16:TP=-1.5:LRA=11[out]")
subprocess.run([FF,'-y','-loglevel','error',*ins,'-filter_complex',';'.join(f),'-map','[out]','-ar','48000','-c:a','pcm_s16le','mix-voice.wav'],check=True)
