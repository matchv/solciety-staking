for(var slots_gap = 1; slots_gap <=365; slots_gap++){
    var last = 0;
    for(var num_nfts=1; num_nfts<=7000; num_nfts++){
        if(slots_gap * (2 + 2 + num_nfts*2) <=16790){
            last = num_nfts;
            if(num_nfts == 7000){
                console.log('slots_gap=', slots_gap, 'num_nfts=', num_nfts);
                break;
            }
        }else{
            console.log('slots_gap=', slots_gap, 'num_nfts=', num_nfts);
            break;
        }
    }
}