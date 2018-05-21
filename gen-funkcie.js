function generateNodes(n, from) {
  var i;
  var result = [];

  for (i = 1; i <= n; i++) { 
    let node = {
      "id": null,
      "wallets":["5af056a8e3a66a4a7f0ad210","5af056a8d009b6512c66ba30","5af056a87de500719da4a1a4","5af056a8d3d2de090a4a1b97","5af056a8395cda3fbd67c5b8"],
      "label":"wallet_1\nwallet_2\nwallet_3\n...\n4954"
    }
    
    node.id = from + i;
    result.push(node);
  }
  
  return result;
}

function generateEdges(n, source, from) {
  var i;
  var result = [];

  for (i = 1; i <= n; i++) { 
    let edge = {
      "id": "e" + from+i,
      "from":source,
      "to":from+i,
      "label":"777.4 BTC",
    }
    
    result.push(edge);
  }
  
  return result;
}