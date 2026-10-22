/* No framework, remote scripts or server required. All paths are repository-relative. */
'use strict';
// Support both the packaged assets layout and the original GitHub image folders.
function recoverPortfolioImage(img){
  if(!(img instanceof HTMLImageElement))return;
  const src=img.getAttribute('src')||'';
  const preview=src.match(/assets\/previews\/project-(\d+)\.webp/);
  let next;
  if(preview){
    const project=portfolioData.projects.find(p=>p.id===Number(preview[1]));
    if(project?.images?.[0])next='assets/images/'+project.images[0].split('/').map(encodeURIComponent).join('/');
  }else if(src.startsWith('assets/images/'))next=src.slice('assets/images/'.length);
  if(next&&next!==src)img.src=next;
}
document.addEventListener('error',event=>recoverPortfolioImage(event.target),true);
document.addEventListener('DOMContentLoaded', () => {
  document.querySelectorAll('img').forEach(img=>{if(img.complete&&!img.naturalWidth)recoverPortfolioImage(img);});
  const $ = (s) => document.querySelector(s);
  const $$ = (s) => [...document.querySelectorAll(s)];
  const escape = (s = '') => String(s).replace(/[&<>"']/g, (c) => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
  const asset = (path) => /^(https?:)?\/\//i.test(path) ? path : 'assets/images/' + path.split('/').map(encodeURIComponent).join('/');
  const { projects, services, personalInfo, experience, education, technicalSkills, tools, courses } = portfolioData;
  const work = projects.filter(p => p.category !== 'addin');
  let filteredWork = work;
  const addins = projects.filter(p => p.category === 'addin');
  const displayTitles = {1:'Six Flags Qiddiya',2:'Motor Speed Park Track',3:'House of Al Saud — Diriyah Gate',4:'Qiddiya Water Park Hotel',5:'Soliman Fakeeh Hospital',6:'EVN Hotels — H09',7:'Uhaud Rofida Hotel',8:'Abha Elmawahwb School',9:'Amalaa Village Building',13:'SEDRA Project'};
  const title = p => displayTitles[p.id] || p.title;
  const categories = portfolioData.categories.filter(c => c.id !== 'addin' && (c.id === 'all' || work.some(p => p.category === c.id)));
  const categoryName = id => portfolioData.categories.find(c => c.id === id)?.name || 'BIM';
  const tags = values => values.map(value => '<span>' + escape(value) + '</span>').join('');

  // The menu and native dialogs preserve focus and keyboard access.
  const menu = $('#mobile-menu');
  const menuToggle = $('#menu-toggle');
  const setMenu = open => {
    menu.hidden = !open;
    menuToggle.setAttribute('aria-expanded', String(open));
    menuToggle.setAttribute('aria-label', open ? 'Close navigation' : 'Open navigation');
    document.body.classList.toggle('menu-open', open);
  };
  menuToggle.addEventListener('click', () => setMenu(menu.hidden));
  menuToggle.addEventListener('keydown', e => {
    if(menu.hidden || e.key !== 'Tab') return;
    e.preventDefault();
    const links = [...menu.querySelectorAll('a')];
    (e.shiftKey ? links.at(-1) : links[0]).focus();
  });
  menu.addEventListener('click', e => { if (e.target.closest('a')) setMenu(false); });
  document.addEventListener('keydown', e => { if(e.key === 'Escape' && !menu.hidden) { setMenu(false); menuToggle.focus(); } });
  menu.addEventListener('keydown', e => {
    if(e.key !== 'Tab') return;
    const links = [...menu.querySelectorAll('a')];
    if(e.shiftKey && document.activeElement === links[0]) { e.preventDefault(); menuToggle.focus(); }
    else if(!e.shiftKey && document.activeElement === links.at(-1)) { e.preventDefault(); menuToggle.focus(); }
  });
  window.matchMedia('(min-width:801px)').addEventListener('change', e => { if(e.matches) setMenu(false); });
  $('#year').textContent = new Date().getFullYear();
  $('#about-text').innerHTML = personalInfo.about;

  services.forEach((s, i) => {
    const item = document.createElement('details');
    item.className = 'service-item'; item.open = i === 0;
    item.innerHTML = '<summary><span>0' + (i + 1) + '</span><h3>' + escape(s.title) + '</h3><span aria-hidden="true">+</span></summary><div class="service-body"><p>' + escape(s.details) + '</p><div class="tech-tags">' + tags(s.technologies) + '</div></div>';
    $('#services-list').append(item);
  });

  const projectExplorer = portfolioExplorer.create({root:$('#project-explorer'),title,categoryName,onOpen:openProject});
  $('#project-view-toggle').addEventListener('click',()=>{
    const gridOpen=$('#projects-grid').hidden;
    $('#projects-grid').hidden=!gridOpen;
    $('#project-explorer').hidden=gridOpen;
    $('#project-view-toggle').setAttribute('aria-expanded',String(gridOpen));
    $('#project-view-toggle').innerHTML=(gridOpen?'Explore in space':'Show project index')+' <span aria-hidden="true">↗</span>';
  });
  // Filters update both the spatial explorer and the optional project index.
  const shortCategory = {all:'All projects',bim:'BIM & coordination',hospitality:'Hospitality',healthcare:'Healthcare',school:'Education'};
  categories.forEach((cat, i) => {
    const button = document.createElement('button');
    button.textContent = shortCategory[cat.id] || cat.name;
    button.dataset.category = cat.id;
    button.setAttribute('aria-pressed', String(i === 0));
    button.addEventListener('click', () => {
      $$('#filter-tabs button').forEach(b => b.setAttribute('aria-pressed', String(b === button)));
      renderProjects(cat.id);
    });
    $('#filter-tabs').append(button);
  });
  function renderProjects(category = 'all') {
    const shown = category === 'all' ? work : work.filter(p => p.category === category);
    filteredWork=shown;
    projectExplorer.setProjects(shown);
    $('#projects-grid').replaceChildren();
    $('#project-count').textContent = String(shown.length).padStart(2, '0') + ' / ' + String(work.length).padStart(2, '0') + ' PROJECTS';
    shown.forEach(p => {
      const button = document.createElement('button');
      button.className = 'project-card reveal';
      button.setAttribute('aria-label', 'Explore ' + title(p));
      button.innerHTML = '<div class="project-image-wrap"><img class="project-image" src="assets/previews/project-' + p.id + '.webp" alt="' + escape(title(p)) + '" loading="lazy" width="1100" height="700"><span class="project-index">' + String(work.indexOf(p) + 1).padStart(2,'0') + '</span><span class="project-arrow" aria-hidden="true">↗</span></div><div class="project-info"><p class="project-meta"><span class="status-dot"></span>' + escape(p.location || 'KSA') + ' / ' + escape(categoryName(p.category)) + '</p><h3 class="project-title">' + escape(title(p)) + '</h3><p class="project-role">' + escape(p.details) + '</p><span class="project-open-label">EXPLORE PROJECT &nbsp; ↗</span></div>';
      button.addEventListener('click', () => openProject(p));
      $('#projects-grid').append(button);
    });
  }
  renderProjects();

  addins.forEach((p, i) => {
    const button = document.createElement('button');
    button.className = 'addin-row';
    button.setAttribute('aria-label', 'Explore ' + p.title);
    button.innerHTML = '<span class="addin-number">0' + (i + 1) + '</span><img src="assets/previews/project-' + p.id + '.webp" alt="" loading="lazy" width="105" height="65"><h3>' + escape(p.title) + '</h3><p>' + escape(p.details) + '</p><span class="arrow" aria-hidden="true">↗</span>';
    button.addEventListener('click', () => openProject(p));
    $('#addins-list').append(button);
  });

  function renderTimeline(items, selector, isEducation = false) {
    items.forEach((item, i) => {
      const entry = document.createElement('details');
      entry.className = 'timeline-item'; entry.open = i === 0;
      entry.innerHTML = '<summary><span class="timeline-date">' + escape(item.period) + '</span><div><h4>' + escape(isEducation ? item.degree : item.title) + '</h4><p class="timeline-company">' + escape(isEducation ? item.school : item.company) + '</p></div><span class="expand-symbol" aria-hidden="true">+</span></summary><p class="timeline-description"><span class="timeline-location">' + escape(item.location) + '</span>' + escape(item.description).replace(/ • /g, '<br><br>') + '</p>';
      $(selector).append(entry);
    });
  }
  renderTimeline(experience, '#experience-timeline');
  renderTimeline(education, '#education-timeline', true);
  $('#resume-tools').innerHTML = tags(tools);
  $('#resume-skills').innerHTML = technicalSkills.map(s => '<li>' + escape(s) + '</li>').join('');
  $('#resume-courses').innerHTML = courses.map(c => '<div class="course-item"><div>' + escape(c.title) + '<small>' + escape(c.provider) + '</small></div><span>' + escape(c.date) + '</span></div>').join('');

  const modal = $('#project-modal');
  const mediaContainer = $('#modal-media-container');
  let currentProject, currentImage = 0;
  let imageZoom=1, panX=0, panY=0, panStart=null;
  function updateImageView(){
    const image=mediaContainer.querySelector('img');
    const maxX=mediaContainer.clientWidth*(imageZoom-1)/2,maxY=mediaContainer.clientHeight*(imageZoom-1)/2;
    panX=Math.max(-maxX,Math.min(maxX,panX));panY=Math.max(-maxY,Math.min(maxY,panY));
    if(image)image.style.transform='translate('+panX+'px,'+panY+'px) scale('+imageZoom+')';
    mediaContainer.classList.toggle('is-zoomed',imageZoom>1);
    $('#zoom-level').textContent=Math.round(imageZoom*100)+'%';
    $('#zoom-out').disabled=imageZoom<=1;$('#zoom-in').disabled=imageZoom>=4;
    $('#gallery-view-hint').textContent=imageZoom>1?'Drag to pan · Arrow keys move the image · Double click to fit':'Zoom in, then drag to inspect the original image.';
  }
  function zoomTo(next){imageZoom=Math.max(1,Math.min(4,next));if(imageZoom===1)panX=panY=0;updateImageView();}
  $('#zoom-in').addEventListener('click',()=>zoomTo(imageZoom+.5));
  $('#zoom-out').addEventListener('click',()=>zoomTo(imageZoom-.5));
  $('#zoom-fit').addEventListener('click',()=>zoomTo(1));
  mediaContainer.addEventListener('dblclick',()=>zoomTo(imageZoom>1?1:2));
  mediaContainer.addEventListener('pointerdown',e=>{
    if(imageZoom<=1||e.button!==0)return;
    panStart={x:e.clientX,y:e.clientY,panX,panY};mediaContainer.setPointerCapture(e.pointerId);
  });
  mediaContainer.addEventListener('pointermove',e=>{
    if(!panStart)return;
    panX=panStart.panX+e.clientX-panStart.x;panY=panStart.panY+e.clientY-panStart.y;updateImageView();
  });
  ['pointerup','pointercancel','lostpointercapture'].forEach(type=>mediaContainer.addEventListener(type,()=>{panStart=null;}));
  function openProject(p) {
    currentProject = p; currentImage = 0;
    $('#modal-title').textContent = title(p);
    $('#modal-category').textContent = (p.category === 'addin' ? 'AMS / Revit automation' : 'Selected work / ' + categoryName(p.category));
    $('#modal-details').textContent = p.details;
    $('.project-switch').hidden=p.category==='addin';
    $('#previous-project').disabled=$('#next-project').disabled=filteredWork.length<2;
    const metadata = [['Location',p.location],['Consultant',p.consultant],['Client',p.client]];
    $('#modal-meta').innerHTML = metadata.filter(([,v]) => v).map(([k,v]) => '<div><dt>' + k + '</dt><dd>' + escape(v) + '</dd></div>').join('');
    $('#modal-technologies').innerHTML = tags(p.technologies || []);
    const reference = $('#modal-ref-link');
    const destination = p.downloadUrl || p.refLink;
    reference.hidden = !destination;
    if(destination) reference.href = destination;
    else reference.removeAttribute('href');
    reference.innerHTML = (p.downloadUrl ? 'Download on Autodesk Marketplace' : p.category === 'addin' ? 'Tool reference' : 'Project reference') + ' <span aria-hidden="true">↗</span>';
    $('#gallery-thumbnails').replaceChildren();
    p.images.forEach((path, i) => {
      const button = document.createElement('button');
      button.className = 'gallery-thumbnail';
      button.setAttribute('aria-label', 'Show image ' + (i + 1));
      button.innerHTML = '<img src="' + asset(path) + '" alt="" loading="lazy">';
      button.addEventListener('click', () => { currentImage = i; renderMedia(); });
      $('#gallery-thumbnails').append(button);
    });
    renderMedia();
    if(!modal.open)modal.showModal();
    modal.scrollTop = 0;
    modal.scrollLeft = 0;
    document.body.classList.add('modal-open');
  }
  function renderMedia() {
    const path = currentProject.images[currentImage];
    mediaContainer.replaceChildren();
    const img = new Image();
    img.alt = title(currentProject) + ' — image ' + (currentImage + 1);
    img.src = asset(path); img.decoding = 'async';
    img.addEventListener('error', () => {
      if(!img.isConnected)return;
      mediaContainer.innerHTML = '<p class="media-error">This image could not be loaded.<a href="' + asset(path) + '" target="_blank" rel="noopener">Open the original image ↗</a></p>';
    });
    mediaContainer.append(img);
    imageZoom=1;panX=panY=0;updateImageView();
    $('#gallery-count').textContent = String(currentImage + 1).padStart(2,'0') + ' / ' + String(currentProject.images.length).padStart(2,'0');
    $('#prev-btn').disabled = $('#next-btn').disabled = currentProject.images.length < 2;
    $$('.gallery-thumbnail').forEach((b, i) => b.setAttribute('aria-pressed', String(i === currentImage)));
  }
  function stepGallery(delta) { if(!currentProject) return; currentImage = (currentImage + delta + currentProject.images.length) % currentProject.images.length; renderMedia(); }
  $('#prev-btn').addEventListener('click', () => stepGallery(-1));
  $('#next-btn').addEventListener('click', () => stepGallery(1));
  $('#close-modal').addEventListener('click', () => modal.close());
  modal.addEventListener('close', () => { document.body.classList.remove('modal-open'); mediaContainer.replaceChildren(); });
  modal.addEventListener('click', e => { if(e.target === modal && e.clientX < modal.getBoundingClientRect().left) modal.close(); });
  modal.addEventListener('keydown',e=>{
    if(!['ArrowLeft','ArrowRight','ArrowUp','ArrowDown'].includes(e.key))return;
    if(imageZoom>1){
      e.preventDefault();panX+=e.key==='ArrowLeft'?35:e.key==='ArrowRight'?-35:0;panY+=e.key==='ArrowUp'?35:e.key==='ArrowDown'?-35:0;updateImageView();
    }else if(e.key==='ArrowLeft'||e.key==='ArrowRight'){e.preventDefault();stepGallery(e.key==='ArrowRight'?1:-1);}
  });
  function switchProject(delta){
    const index=filteredWork.findIndex(p=>p.id===currentProject.id);
    if(index>=0)openProject(filteredWork[(index+delta+filteredWork.length)%filteredWork.length]);
  }
  $('#previous-project').addEventListener('click',()=>switchProject(-1));
  $('#next-project').addEventListener('click',()=>switchProject(1));
  let touchX = null;
  mediaContainer.addEventListener('touchstart', e => { touchX = imageZoom>1?null:e.changedTouches[0].clientX; }, {passive:true});
  mediaContainer.addEventListener('touchend', e => { if(touchX !== null) { const distance = e.changedTouches[0].clientX - touchX; if(Math.abs(distance) > 55) stepGallery(distance < 0 ? 1 : -1); touchX = null; } }, {passive:true});

  portfolioModelController.init();
  if('IntersectionObserver' in window) {
    const observer=new IntersectionObserver(entries=>{
      entries.forEach(entry=>{ if(entry.isIntersecting) $$('.desktop-nav a').forEach(a=>a.classList.toggle('active',a.hash==='#'+entry.target.id)); });
    },{rootMargin:'-15% 0px -55% 0px'});
    $$('main>section').forEach(section=>observer.observe(section));
  }
});



