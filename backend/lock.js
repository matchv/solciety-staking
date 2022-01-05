
var redis = require('redis');
const rdsClient = redis.createClient();
(async () => {

    rdsClient.on('error', (err) => console.log('Redis Client Error', err));

    await rdsClient.connect();
})();
const bitsKey="bitsKey";
async function next(){
    while(true){

        var index = await rdsClient.bitPos(bitsKey, 1);
        if( index == -1){
            return undefined;
        }
        var key = "lock"+index;
        var lock = await rdsClient.setNX(key, "1");
        if(lock){
            await rdsClient.setBit(bitsKey, index, 0);
            await rdsClient.del(key)
            var rtn = await rdsClient.get(index+"");
            return rtn;
        }else{
        }
    }
}

function gen(){
    for(var i=0; i<5; i++){
        var obj={
            tokenAddress:"ta_"+i,
            accountAddress:"aa_"+i
        };
        rdsClient.set(""+i, JSON.stringify(obj));
        rdsClient.setBit(bitsKey, i, 1);
    }
}

gen();

for(var i=0; i<6; i++){
    next().then(a=>{
        console.log(a);
    });
}

(async ()=>{

    for(var i=0; i<6; i++){
        next().then(a=>{
            console.log(a);
        });
    }

})();

console.log("1111111111111111111")
console.log("2222222222222222")