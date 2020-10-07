import {dateForTimestamp} from './timestamps';

const totalTimeLogged = header => {
  const logBookEntries = header.get('logBookEntries', []);
 
  const times =  logBookEntries.map(entry => 
    (entry.get('start') && entry.get('end')) 
      ? dateForTimestamp(entry.get('end')) - dateForTimestamp(entry.get('start')) 
      : 0)

  const addedTimes = times.reduce((acc,val)=>acc+val,0);
  return addedTimes;
}

const sliceHeaderAndSubheaders = (headers, index)=>{
  const nestingLevel = headers.get(index).get('nestingLevel')
  const headerAndFollowingHeaders = headers.slice(index);
  for (
    var followingHeaderIndex = 1;
    followingHeaderIndex < headerAndFollowingHeaders.size;
    followingHeaderIndex++
  ) {
    if (!headerAndFollowingHeaders.get(followingHeaderIndex) 
        || (headerAndFollowingHeaders.get(followingHeaderIndex).get('nestingLevel') <= nestingLevel)) {
      break;
    }
  }
  return headerAndFollowingHeaders.slice(0, followingHeaderIndex);
}

export const updateHeadersTotalTimeLogged = (headers) => {
  if(!headers){
    return headers;
  }
  const headersWithtotalTimeLogged = headers.map((header)=>
    header.set('totalTimeLogged',totalTimeLogged(header)));
  const headersWithtotalTimeLoggedRecursive = headersWithtotalTimeLogged.map(
    (header,index)=>{
    const headerAndSubheaders = sliceHeaderAndSubheaders(headersWithtotalTimeLogged,index);
    const totalTimeLoggedRecursive = headerAndSubheaders.reduce(
      (acc,val)=>acc+val.get('totalTimeLogged'),
      0);
    return header.set('totalTimeLoggedRecursive', totalTimeLoggedRecursive);
  });
  return headersWithtotalTimeLoggedRecursive;
}