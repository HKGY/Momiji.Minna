(function () {
  var bg_data = [{"pid":"715","hiturl":"https://hi4fun.com/landing/fl1","wnUrl":"","box":"https://ad-static-xg.tagtic.cn/ad-material/images/03pLLrv9wvULXQykTiL4fkvY1v8ogdxdIdro2tj5.jpg","txt":"","tid":1,"width":120,"height":240,"weight":-2001.51123046875,"time":10,"IsUnion":1,"type":0,"impTrackerList":["https://g1.tagtic.cn/don/wn?encode_nyg=cmVxaWQ9WTUtbkhrNU93eDhUaGhWS3g0eG91JmNvbz0yN2U0MmQ0ZmMxYTNhNzY3OWVhMWE3ODQ2YjZiZmM3YTdmYzUwZjkwNGYyNDAxY2VlY2QwMmY0NzA3NzZmMDk0JmRwaWQ9MjdlNDJkNGZjMWEzYTc2NzllYTFhNzg0NmI2YmZjN2E3ZmM1MGY5MDRmMjQwMWNlZWNkMDJmNDcwNzc2ZjA5NCZvcz0zJnJlZj1odHRwcyUzQSUyRiUyRmJicy5uZ2EuY24lMkYmYWR2ZXJ1c2VyaWQ9OTAzJm9yZGVyaWQ9MjczMzUmYWlkPTE2MDM3JnByb3ZpbmNlSWQ9MjAmcGF5bWVudD1jcHQmYWRfZnJvbT0wJm1pZD0xNjAzNzEmZ3JvdXBfaWQ9MTYwMzcxJnBvc2l0aW9uPTY2NCZ3PTEyMCZoPTI0MCZjb3N0PTAmY29lZmZpY2llbnQ9MSZzbG90QmluZGluZz1zaW5nbGUmY29tcGFyZV9idWNrZXRfaWQ9YSZ0cmFmZmljX2J1Y2tldF9pZD1wMzMyMTImaXNVbmlvbj0x&v_y=862fe9e7cb57a5b14f0a94d1cb480677c1efa162e67508cd04c0864af01f4b75&"],"clkTrackerList":["https://g1.tagtic.cn/don/cl?encode_nyg=cmVxaWQ9WTUtbkhrNU93eDhUaGhWS3g0eG91JmNvbz0yN2U0MmQ0ZmMxYTNhNzY3OWVhMWE3ODQ2YjZiZmM3YTdmYzUwZjkwNGYyNDAxY2VlY2QwMmY0NzA3NzZmMDk0JmRwaWQ9MjdlNDJkNGZjMWEzYTc2NzllYTFhNzg0NmI2YmZjN2E3ZmM1MGY5MDRmMjQwMWNlZWNkMDJmNDcwNzc2ZjA5NCZvcz0zJnJlZj1odHRwcyUzQSUyRiUyRmJicy5uZ2EuY24lMkYmYWR2ZXJ1c2VyaWQ9OTAzJm9yZGVyaWQ9MjczMzUmYWlkPTE2MDM3JnByb3ZpbmNlSWQ9MjAmcGF5bWVudD1jcHQmYWRfZnJvbT0wJm1pZD0xNjAzNzEmZ3JvdXBfaWQ9MTYwMzcxJnBvc2l0aW9uPTY2NCZ3PTEyMCZoPTI0MCZjb3N0PTAmY29lZmZpY2llbnQ9MSZzbG90QmluZGluZz1zaW5nbGUmY29tcGFyZV9idWNrZXRfaWQ9YSZ0cmFmZmljX2J1Y2tldF9pZD1wMzMyMTImaXNVbmlvbj0x&v_y=862fe9e7cb57a5b14f0a94d1cb480677c1efa162e67508cd04c0864af01f4b75"]}];

  function request(urlList) {
    for (var i = 0; i < urlList.length; i++) {
      var url = urlList[i];
      var x = document.createElement("script")
      x.src = url;
      document.getElementsByTagName("head")[0].appendChild(x);
    }
  }

  if (bg_data.length > 0) {
    var ref = bg_data[0].box.substring(bg_data[0].box.lastIndexOf('/'), bg_data[0].box.lastIndexOf('.'));
    ngaAds.push({
      "id": "bbs_ads24",
      "isUnion": "" + bg_data[0].IsUnion + "",
      "file": "" + bg_data[0].box + "",
      "url": "" + bg_data[0].hiturl + "",
      "title": "",
      "width": "" + bg_data[0].width + "",
      "height": "" + bg_data[0].height + "",
      "date": "all",
      "rate": "100",
      "nolog": "1",
      "type": "" + bg_data[0].type + "",
      "sgid": bg_data[0].pid,
      "refreshid": "" + ref + "",
      "onload": function () {
        request(bg_data[0].impTrackerList)
      },
      "onclick": function () {
        request(bg_data[0].clkTrackerList)
      }
    });
  }
})();