// vg chrome (v107): SINGLE source for the shared nav, side-panel and footer.
// Pages ship only <head> + their unique body content; this injects the chrome
// once at runtime so the markup is never copied into the HTML files.
// Loaded (defer) BEFORE site.js so site.js can wire the rig it injects.
(function () {
  var path = location.pathname || "/";
  var file = path.split("/").pop() || "";
  if (file === "index.html") file = "";
  function on(f) { return f === file ? ' class="on"' : ""; }

  var LINKS = [
    ["", "HOME", "/"],
    ["products.html", "PRODUCTS", "/products.html"],
    ["games.html", "GAMES", "/games.html"],
    ["status.html", "STATUS", "/status.html"],
    ["videos.html", "VIDEOS", "/videos.html"],
    ["outtakes.html", "OUTTAKES", "/outtakes.html"]
  ];
  var links = "";
  for (var i = 0; i < LINKS.length; i++) {
    var l = LINKS[i];
    links += '<a' + on(l[0]) + ' href="' + l[2] + '">' + l[1] + '</a>';
  }

  var NAV = '<nav><div class="wrap">'
    + '<a class="logo" href="/"><img class="logo-mark" src="/assets/brand/logo-128.jpg" alt="">THEGMPTeam STUDIOS</a>'
    + '<span class="links">' + links + '</span>'
    + '</div></nav>';

  var SIDE = '<div id="vgpanel" aria-hidden="true">' + '<div id="vgchain" aria-hidden="true"><div id="vgtrack"></div></div>'
    + '<div id="vgen" aria-hidden="true">'
    + '<img class="vgen-cap top" src="/assets/gen/topcap.png" alt="">'
    + '<img class="vgen-rail left" src="/assets/gen/conduit.png" alt="">'
    + '<img class="vgen-rail right" src="/assets/gen/conduit.png" alt="">'
    + '<img class="vgen-cap bot" src="/assets/gen/botcap.png" alt="">'
    + '<img class="vgen-bolt tl" src="/assets/gen/bracket.png" alt=""><img class="vgen-bolt tr" src="/assets/gen/bracket.png" alt=""><img class="vgen-bolt bl" src="/assets/gen/bracket.png" alt=""><img class="vgen-bolt br" src="/assets/gen/bracket.png" alt="">'
    + '<div id="vgencore" aria-hidden="true"></div>'
    + '</div>'
    + '<div class="vgsprocket t"><img class="p1" src="/assets/gear_bronze.png?v=95" alt=""><img class="p2" src="/assets/gear_small.png?v=96" alt=""><img class="p3" src="/assets/gear_ref1.png?v=95" alt=""></div>'
    + '<div class="vgsprocket b"><img class="p1" src="/assets/gear_main.png?v=95" alt=""><img class="p2" src="/assets/gear_dome.png?v=95" alt=""><img class="p3" src="/assets/gear_small.png?v=96" alt=""><img class="p4" src="/assets/gear_ref3.png?v=95" alt=""><img class="p5" src="/assets/gear_ref2.png?v=95" alt=""></div>' + '</div>'
    + '<div id="vgenbeam" aria-hidden="true"></div>';

  var note = "";
  var FOOT = '<footer><div class="wrap">'
    + '<span class="dot"></span>'
    + '<span>&copy; 2026 TheGMPTeam Studios — built on hardware we own. <a href="https://github.com/TheGMPTeam">github.com/TheGMPTeam</a> &middot; <a href="https://www.youtube.com/@TheGMPTeamStudios">youtube.com/@TheGMPTeamStudios</a> &middot; <a href="mailto:studio@thegmpteamstudios.com">studio@thegmpteamstudios.com</a></span>'
    + note
    + '</div></footer>';

  var b = document.body;
  b.insertAdjacentHTML("afterbegin", NAV);
  b.insertAdjacentHTML("beforeend", FOOT + SIDE);
})();
