import json
d=json.load(open('vo/durs.json'))
# chapter -> narration lines it carries (matches SEG order in comp.html)
CH=[[0,1],[2],[3],[4],[5,6],[7],[8],[9],[10],[11],[12],[13],[14],[15]]
st={}; seg=[]; tm={}; t=0.0
for c,lines in enumerate(CH):
    s=0.0 if c==0 else t+0.45; seg.append(round(s,3))
    cur=s+(0.9 if c==0 else 0.55)
    for j,li in enumerate(lines):
        if li==6: tm['accept']=round(cur-0.05,3); cur+=0.3
        st[li]=cur; cur+=d[li]+0.35
        if li==7: tm['drag0']=round(s+1.3,3); tm['drag1']=round(s+2.2,3)
        if li==14: tm['type0']=round(st[14]+3.1,3)
    t=st[lines[-1]]+d[lines[-1]]
tm['out']=round(t+0.55,3); st[16]=tm['out']+1.1; tm['end']=round(st[16]+d[16]+1.3,3)
caps=[]
for i in range(16):
    nxt=st[i+1] if i+1<16 else tm['out']
    caps.append([round(st[i]-0.05,3), round(min(st[i]+d[i]+0.35, nxt-0.3),3)])
tm.update(seg=seg,caps=caps,vo=[round(st[i],3) for i in range(17)])
json.dump(tm,open('timing.json','w'),indent=0); print(json.dumps({k:tm[k] for k in ['seg','accept','drag0','type0','out','end']}))
