document.getElementById('year').textContent=new Date().getFullYear();
const menu=document.querySelector('.menu');
const links=document.querySelector('.nav-links');
menu?.addEventListener('click',()=>{const open=links.dataset.open==='1';links.dataset.open=open?'0':'1';links.style.display=open?'none':'flex';if(!open){links.style.position='absolute';links.style.top='74px';links.style.left='0';links.style.right='0';links.style.padding='18px 20px';links.style.background='rgba(7,11,22,.97)';links.style.borderBottom='1px solid rgba(255,255,255,.1)';links.style.flexDirection='column';links.style.gap='16px'}});
links?.querySelectorAll('a').forEach(a=>a.addEventListener('click',()=>{if(innerWidth<801){links.style.display='none';links.dataset.open='0'}}));