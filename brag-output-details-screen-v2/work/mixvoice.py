# Soundtrack: Kokoro narration at its timeline.json starts, very soft UI clicks and key ticks,
# and (with --music) a light music bed well under the voice.
import sys
MUSIC='--music' in sys.argv
import json,subprocess,os
FF='/usr/local/lib/python3.11/dist-packages/imageio_ffmpeg/binaries/ffmpeg-linux-x86_64-v7.0.2'
A=os.path.expanduser('~/.claude/skills/brag/assets')
T=json.load(open('timeline.json')); END=T['end']; N=len(T['vo'])
ins=['-f','lavfi','-t',str(END),'-i','anullsrc=r=48000:cl=stereo','-i',f'{A}/sfx/ui/click2.ogg','-i',f'{A}/sfx/interface/click_003.ogg']
for i in range(N): ins+=['-i',f'vo/l{i:02d}.wav']
f=[]
if MUSIC:
    ins+=['-i',f'{A}/music/happy-beats-business-moves-vol-1-by-ende-dot-app.mp3']
    f.append(f"[{3+N}:a]atrim=0:{END},asetpts=N/SR/TB,aformat=sample_rates=48000:channel_layouts=stereo,afade=t=in:d=1.0,afade=t=out:st={END-2.5}:d=2.5,volume=0.10[m]")
def bank(inp,times,vol,tag):
    n=len(times)
    f.append(f"[{inp}:a]aformat=sample_rates=48000:channel_layouts=stereo,lowpass=f=6500,volume={vol},asplit={n}"+''.join(f'[{tag}{i}]' for i in range(n)))
    for i,t in enumerate(times): f.append(f"[{tag}{i}]adelay={int(t*1000)}|{int(t*1000)}[{tag}d{i}]")
    f.append(''.join(f'[{tag}d{i}]' for i in range(n))+f"amix=inputs={n}:normalize=0[{tag}]")
bank(1,T['clicks'],0.16,'c'); bank(2,T['keys'],0.08,'k')
for i in range(N):
    ms=int(T['vo'][i]*1000); f.append(f"[{3+i}:a]aformat=sample_rates=48000:channel_layouts=stereo,adelay={ms}|{ms}[v{i}]")
f.append(''.join(f'[v{i}]' for i in range(N))+f"amix=inputs={N}:normalize=0,highpass=f=70,acompressor=threshold=0.2:ratio=3:attack=5:release=120[vo]")
mix='[0:a][c][k][vo]'+('[m]' if MUSIC else '')
f.append(f"{mix}amix=inputs={5 if MUSIC else 4}:normalize=0,atrim=0:{END},loudnorm=I=-16:TP=-1.5:LRA=11[out]")
subprocess.run([FF,'-y','-loglevel','error',*ins,'-filter_complex',';'.join(f),'-map','[out]','-ar','48000','-c:a','pcm_s16le',('mix-voice-music.wav' if MUSIC else 'mix-voice.wav')],check=True)
print('ok')
