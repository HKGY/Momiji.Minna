(function () {
  var bg_data = [{"pid":"6002","hiturl":"https://cps.360game.360.cn/gamedetail?gtype=webgame&pl=xbox&gkey=ssqyol&src=lmcps100160201-cps","wnUrl":"","box":"https://ad-static-xg.tagtic.cn/ad-material/images/UGancFdNFkCo9njS3LQFsKbLLFg5VWoeWpX57XTh.gif","txt":"","tid":1,"width":120,"height":600,"weight":-2007.858642578125,"time":5,"IsUnion":1,"type":0,"impTrackerList":["https://g1.tagtic.cn/don/wn?encode_nyg=cmVxaWQ9QjBaWElCbGUxb0tFODFyUnNqNlZqJmNvbz0yN2U0MmQ0ZmMxYTNhNzY3OWVhMWE3ODQ2YjZiZmM3YTdmYzUwZjkwNGYyNDAxY2VlY2QwMmY0NzA3NzZmMDk0JmRwaWQ9MjdlNDJkNGZjMWEzYTc2NzllYTFhNzg0NmI2YmZjN2E3ZmM1MGY5MDRmMjQwMWNlZWNkMDJmNDcwNzc2ZjA5NCZvcz0zJnJlZj1odHRwcyUzQSUyRiUyRmJicy5uZ2EuY24lMkYmYWR2ZXJ1c2VyaWQ9OTAzJm9yZGVyaWQ9MjczMzcmYWlkPTE2MDM5JnByb3ZpbmNlSWQ9MjImcGF5bWVudD1jcHQmYWRfZnJvbT0wJm1pZD0xNjAzOTEmZ3JvdXBfaWQ9MTYwMzkxJnBvc2l0aW9uPTgxNyZ3PTEyMCZoPTYwMCZjb3N0PTAmY29lZmZpY2llbnQ9MSZzbG90QmluZGluZz1zaW5nbGUmY29tcGFyZV9idWNrZXRfaWQ9YSZ0cmFmZmljX2J1Y2tldF9pZD1wMzM1MTAmaXNVbmlvbj0x&v_y=383129f5d7917319739ea5bf81dc227b495281dae69b1333c3939e90368fead3&"],"clkTrackerList":["https://g1.tagtic.cn/don/cl?encode_nyg=cmVxaWQ9QjBaWElCbGUxb0tFODFyUnNqNlZqJmNvbz0yN2U0MmQ0ZmMxYTNhNzY3OWVhMWE3ODQ2YjZiZmM3YTdmYzUwZjkwNGYyNDAxY2VlY2QwMmY0NzA3NzZmMDk0JmRwaWQ9MjdlNDJkNGZjMWEzYTc2NzllYTFhNzg0NmI2YmZjN2E3ZmM1MGY5MDRmMjQwMWNlZWNkMDJmNDcwNzc2ZjA5NCZvcz0zJnJlZj1odHRwcyUzQSUyRiUyRmJicy5uZ2EuY24lMkYmYWR2ZXJ1c2VyaWQ9OTAzJm9yZGVyaWQ9MjczMzcmYWlkPTE2MDM5JnByb3ZpbmNlSWQ9MjImcGF5bWVudD1jcHQmYWRfZnJvbT0wJm1pZD0xNjAzOTEmZ3JvdXBfaWQ9MTYwMzkxJnBvc2l0aW9uPTgxNyZ3PTEyMCZoPTYwMCZjb3N0PTAmY29lZmZpY2llbnQ9MSZzbG90QmluZGluZz1zaW5nbGUmY29tcGFyZV9idWNrZXRfaWQ9YSZ0cmFmZmljX2J1Y2tldF9pZD1wMzM1MTAmaXNVbmlvbj0x&v_y=383129f5d7917319739ea5bf81dc227b495281dae69b1333c3939e90368fead3"]}];

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
      "id": "bbs_ads45",
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