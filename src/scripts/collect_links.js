function saveLinksToFile(links) {
  var linksText = links.join('\n');
  var blob = new Blob([linksText], { type: 'text/plain' });
  var url = window.URL.createObjectURL(blob);
  var link = document.createElement('a');

  link.href = url;
  link.download = 'links.txt';

  document.body.appendChild(link);

  link.click();

  document.body.removeChild(link);
  window.URL.revokeObjectURL(url);
}

function openLinksInNewTabs(links) {
  links.forEach(function (link) {
    window.open(link, '_blank');
  });
}

var aTags = document.querySelectorAll('a._a6hd');

var listOfLinks = Array.from(aTags)
  .map((a) => a.getAttribute('href'))
  .filter((href) => href.startsWith('/p/'))
  .map((link) => 'https://instagram.com' + link);

saveLinksToFile(listOfLinks);

openLinksInNewTabs(listOfLinks);
