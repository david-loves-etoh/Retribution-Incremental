function deduceDisplay() {
    if(!player.retributions) {
        if(player.points.lte(new Decimal(10).tetrate(9e99))) return format(player.points);
        return "ω";
    }
    if(player.retributions == 1) return deducePhi(player.points,0);
}

function deducePhi(a)
{
    if(a.lt(10)) return a.add(1).floor().toNumber();
    if(a.lt(100)) return 'ω<sup>' + a.eq(0) ? "" : deducePhi(a.sub(10)) + '</sup>';
    if(a.lt(1000)) return 'ε<sub>' + deducePhi(a.sub(100)) + '</sub>';
    if(a.lt(10000)) return 'ζ<sub>' + deducePhi(a.sub(1000)) + '</sub>';
    if(a.lt(100000)) return 'η<sub>' + deducePhi(a.sub(10000)) + '</sub>';
    if(a.lt('10^^10')) return 'φ('+deducePhi(a.log10().sub(1).floor())+',0)';
    return 'φ(1,0,0)';
}
