window.openZcalModal = function(e = "indiv") {
    let t = document.getElementById("zcal-modal"),
        a = document.getElementById("zcal-modal-container");

    if (t && a) {
        const iframes = document.querySelectorAll('#content-tele iframe, #content-couple iframe, #content-indiv iframe');
        
        iframes.forEach(iframe => {
            if (iframe.dataset.src && !iframe.getAttribute('src')) {
                iframe.src = iframe.dataset.src;
            }
        });

        t.classList.remove("hidden", "opacity-0");
        document.body.style.overflow = "hidden";
        
        requestAnimationFrame(() => {
            a.classList.remove("scale-95", "opacity-0");
        });

        window.switchZcalTab(e);
    }
};
window.closeZcalModal=function(){let e=document.getElementById("zcal-modal"),t=document.getElementById("zcal-modal-container");e&&t&&(t.classList.add("scale-95","opacity-0"),e.classList.add("opacity-0"),setTimeout(()=>{e.classList.add("hidden"),document.body.style.overflow=""},300))},window.switchZcalTab=function(e){["tele","couple","indiv"].forEach(t=>{let a=document.getElementById("content-"+t),l=document.getElementById("tab-"+t);a&&l&&(t===e?(a.classList.remove("opacity-0","pointer-events-none"),a.classList.add("z-10"),l.classList.add("active")):(a.classList.add("opacity-0","pointer-events-none"),a.classList.remove("z-10"),l.classList.remove("active")))})},document.addEventListener("DOMContentLoaded",function(){if(!document.getElementById("zcal-modal")){let e=`
            <div id="zcal-modal" style="z-index: 99999 !important;" class="fixed inset-0 hidden flex items-center justify-center p-4 bg-black/30 transition-all duration-300 opacity-0" role="dialog" aria-modal="true" aria-labelledby="zcal-modal-title">
            <!-- Overlay -->
            <div class="absolute inset-0" onclick="closeZcalModal()"></div>
            <!-- Modal -->
            <div id="zcal-modal-container" class="glass-effect relative w-full h-full md:h-[95vh] rounded-2xl shadow-xl flex flex-col overflow-hidden transform scale-95 opacity-0 transition-all duration-300">
                <!-- Header -->
                <div class="flex justify-between items-center px-6 py-4 border-b border-white/30 bg-white/40">
                    <h3 id="zcal-modal-title" class="text-2xl md:text-3xl font-light text-custom-accent">Prise de rendez-vous
      </h3>
                    <button onclick="closeZcalModal()" aria-label="Fermer la modale" class="text-gray-400 hover:text-gray-600 transition-colors duration-200">
                        <svg xmlns="http://www.w3.org/2000/svg" class="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"/>
                        </svg>
                    </button>
                </div>
                <!-- Tabs -->
                <div class="flex justify-center py-8 w-full">
                    <div class="inline-flex bg-[#a37b73]/10 p-1.5 rounded-full border border-[#a37b73]/20 gap-2">
                        <button id="tab-indiv" onclick="switchZcalTab('indiv')" class="tab-btn px-4 py-2 md:px-8 md:py-3 md:text-lg font-medium text-[#a37b73] rounded-full transition-all duration-300 hover:bg-[#a37b73]/10">
                            <span class="text-full">Individuelle</span>
                            <span class="text-short">Indiv.</span>
                        </button>
                        <button id="tab-couple" onclick="switchZcalTab('couple')" class="tab-btn px-4 py-2 md:px-8 md:py-3 md:text-lg font-medium text-[#a37b73] rounded-full transition-all duration-300 hover:bg-[#a37b73]/10">Couple
        </button>
                        <button id="tab-tele" onclick="switchZcalTab('tele')" class="tab-btn active px-4 py-2 md:px-8 md:py-3 md:text-lg font-medium text-[#a37b73] rounded-full transition-all duration-300">
                            <span class="text-full">T\xe9l\xe9consultation</span>
                            <span class="text-short">T\xe9l\xe9.</span>
                        </button>
                    </div>
                </div>
                <!-- Content -->
                <div class="relative flex-grow">
                    <div id="content-tele" class="absolute inset-0 opacity-100 transition-opacity duration-300">
                        <iframe data-src="https://zcal.co/i/QAIUtOXb?embed=1&embedType=iframe" class="w-full h-full border-0" title="Agenda t\xe9l\xe9consultation"></iframe>
                    </div>
                    <div id="content-couple" class="absolute inset-0 opacity-0 pointer-events-none transition-opacity duration-300">
                        <iframe data-src="https://zcal.co/i/yjsqTQCY?embed=1&embedType=iframe" class="w-full h-full border-0" title="Agenda couple"></iframe>
                    </div>
                    <div id="content-indiv" class="absolute inset-0 opacity-0 pointer-events-none transition-opacity duration-300">
                        <iframe data-src="https://zcal.co/i/9zS2bGmt?embed=1&embedType=iframe" class="w-full h-full border-0" title="Agenda individuel"></iframe>
                    </div>
                </div>
            </div>
        </div>`;document.body.insertAdjacentHTML("beforeend",e)}if(!document.getElementById("contact-modal")){let t=`
            <div id="contact-modal" style="background-color: rgba(0, 0, 0, 0.6); backdrop-filter: blur(4px);" class="hidden pointer-events-none fixed inset-0 flex items-center justify-center z-50 opacity-0 transition-opacity duration-300">
                <div style="background-color: rgba(255, 255, 255, 0.95); backdrop-filter: blur(10px);" class="border border-white/30 rounded-2xl p-8 shadow-2xl max-w-sm w-full text-center relative transform scale-95 transition-transform duration-300">
                    <button id="contact-close-modal-btn" class="absolute top-3 right-3 text-gray-500 hover:bg-gray-100 p-2 rounded-full"><i class="fas fa-times"></i></button>
                    <h2 class="text-2xl font-bold text-custom-dark mb-4">Me contacter</h2>
                    <p class="mb-4">contact.sexologique@gmail.com</p>
                    <button id="copy-email-btn" class="bg-custom-dark text-white px-4 py-2 rounded-full mb-2 hover:opacity-90 transition">Copier l'email</button>
                    <div id="copy-success-msg" class="text-green-600 opacity-0 transition-opacity text-sm font-semibold">Copi\xe9 !</div>
                </div>
            </div>`;document.body.insertAdjacentHTML("beforeend",t)}let a=document.getElementById("main-header");a&&window.addEventListener("scroll",()=>a.classList.toggle("header-scrolled",window.scrollY>50),{passive:!0});let l=document.getElementById("mobile-menu-button"),i=document.getElementById("mobile-menu");if(l&&i){let s=l.querySelector("i"),n=()=>{i.classList.add("hidden"),s&&(s.className="fas fa-bars"),l.setAttribute("aria-expanded","false")};l.addEventListener("click",e=>{e.stopPropagation();let t=i.classList.toggle("hidden");s&&(s.className=t?"fas fa-bars":"fas fa-times"),l.setAttribute("aria-expanded",!t)}),document.addEventListener("click",e=>{i.classList.contains("hidden")||i.contains(e.target)||l.contains(e.target)||n()}),i.querySelectorAll("a, button").forEach(e=>e.addEventListener("click",n))}document.addEventListener("keydown",e=>{if("Escape"===e.key){window.closeZcalModal();let t=document.getElementById("contact-modal");t&&!t.classList.contains("hidden")&&document.getElementById("contact-close-modal-btn")?.click()}});let o=document.getElementById("contact-modal"),c=document.getElementById("mail-btn"),d=document.getElementById("contact-close-modal-btn"),r=document.getElementById("copy-email-btn");if(c&&o){let m=e=>{e&&e.preventDefault(),o.classList.remove("hidden","pointer-events-none"),requestAnimationFrame(()=>o.classList.remove("opacity-0"))},p=()=>{o.classList.add("opacity-0"),setTimeout(()=>o.classList.add("hidden","pointer-events-none"),300)};c.addEventListener("click",m),d&&d.addEventListener("click",p),o.addEventListener("click",e=>{e.target===o&&p()}),r&&r.addEventListener("click",()=>{navigator.clipboard.writeText("contact.sexologique@gmail.com").then(()=>{let e=document.getElementById("copy-success-msg");e&&(e.classList.remove("opacity-0"),setTimeout(()=>e.classList.add("opacity-0"),2e3))})})}let u=document.getElementById("copy-url-button");if(u){let b=window.location.href.split("?")[0],f=document.title;["fb-share","tw-share","li-share"].forEach(e=>{let t=document.getElementById(e);t&&("fb-share"===e&&(t.href=`https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(b)}`),"tw-share"===e&&(t.href=`https://twitter.com/intent/tweet?url=${encodeURIComponent(b)}&text=${encodeURIComponent(f)}`),"li-share"===e&&(t.href=`https://www.linkedin.com/shareArticle?mini=true&url=${encodeURIComponent(b)}&title=${encodeURIComponent(f)}`))});let $=document.getElementById("mail-share");$&&$.addEventListener("click",e=>{e.preventDefault(),window.location.href=`mailto:?subject=${encodeURIComponent(f)}&body=${encodeURIComponent("Je te recommande cet article : "+b)}`}),u.addEventListener("click",()=>{navigator.clipboard.writeText(b).then(()=>{u.classList.add("copied"),setTimeout(()=>u.classList.remove("copied"),2500)})})}let y=document.getElementById("latest-articles-list");if(y){let h=y.closest(".card")?.querySelector("h3"),v=document.getElementById("refresh-articles");if(h&&!v){let g=document.createElement("div");g.className="flex justify-between items-baseline",(v=document.createElement("button")).id="refresh-articles",v.className="text-gray-400 hover:text-custom-dark transition p-2 mb-4",v.setAttribute("aria-label","Rafra\xeechir les suggestions"),v.innerHTML='<i class="fas fa-sync-alt"></i>',h.replaceWith(g),g.appendChild(h),g.appendChild(v)}let x=()=>{v&&(v.disabled=!0,v.innerHTML='<i class="fas fa-spinner fa-spin"></i>');let e=window.location.pathname.includes("/articles/")?"../articles.json":"articles.json";fetch(e).then(e=>e.json()).then(e=>{let t=window.location.pathname.replace(/\/$/,"").split("/").pop().replace(".html",""),a=e.filter(e=>!e.url.includes(t)).sort(()=>.5-Math.random()).slice(0,6);y.innerHTML=a.map(e=>`
                    <li><a href="${e.url}" class="latest-article-card">
                        <div><p class="article-title">${e.title}</p><p class="article-category">${e.category}</p></div>
                    </a></li>`).join("")||"<li><p>Aucun autre article.</p></li>"}).catch(e=>{console.warn("Erreur chargement articles:",e),y.innerHTML="<li>Impossible de charger les suggestions.</li>"}).finally(()=>{v&&(v.disabled=!1,v.innerHTML='<i class="fas fa-sync-alt"></i>')})};v&&v.addEventListener("click",x),x()}});