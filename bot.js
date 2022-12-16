const AttackName = 'Царапанье';
const MaxLevel = 100;

var attackId = -1;
var attackNumber = "";

var prevIsBattle = false;
var needToCheckPokemon = false;
var needHeel = false;
var isHealing = false;

var round = 0;
var captchaRound = 0;

stopBot = false;

var mainPokemonData = null;

var pathTable = path1;

var path1 = [
    {"Name": "Пещера тайн", "Id": 11},
    {"Name": "Селадон", "Id": 10},
    {"Name": "Покецентр", "Id": 19}
]

function Initialize() {
    console.log('[Bot] Initializing...');
    for (var i = 0; i < 20; i++) {
        attackNumber = "atk_" + i;
        if (mainPokemonData[attackNumber] != null) {
            if (mainPokemonData[attackNumber]['name'] == AttackName) {
                console.log('[Bot] Founded attack: id=' + mainPokemonData[attackNumber]['id'] + ', attackNumber=' + attackNumber);
                attackId = mainPokemonData[attackNumber]['id'];
                break;
            }
        }
    }

    if (attackId == -1) {
        console.log('[Bot] CRITICAL!!!! Unable to find attack!!!')
        return;
    }

    if (mainPokemonData['lvl'] >= MaxLevel) {
        console.log('[Bot] Pokemon is equal or greater than max level!')
        return;
    }

    assault = !0

    console.log('[Bot] Initialized!')
    Update();
}

function Update() {
    setTimeout(function() {
        var isBattle = document.title == 'PokePower - Бой!';

        if (needHeel) {
            console.log('[Bot] Go to heal pokemon');
            needHeel = false;
            isHealing = true;
            assault = !1;
            GoToHealPokemon();
        }

        if (isBattle && prevIsBattle) {
            round = round + 1;
            var captcha = document.getElementsByClassName('captcha')[0];
            if (captcha.style.display != 'none' && round > 1) {
                console.log('[Bot] Captcha...');
                captchaRound = captchaRound + 1;
                if (captchaRound > 2) {
                    var title = captcha.childNodes[1];
                    var formula = title.textContent.replace('=', '');
                    var result = Evaluate(formula);
                    ClassBattle._action({'captcha': result});
                    console.log('[Bot] Captcha done');
                    captchaRound = 0;
                }
                else {
                    console.log('[Bot] Attack with id ' + attackId);
                    ClassBattle._action({'targetAtk': attackId});
                }
            }
            else {
                console.log('[Bot] Attack with id ' + attackId);
                ClassBattle._action({'targetAtk': attackId});
            }
        }
        
        if (needToCheckPokemon) {
            round = 0;
            if (mainPokemonData['lvl'] >= MaxLevel) {
                console.log('[Bot] Pokemon is equal or greater than max level!')
                StopBot();
                return;
            }

            var maxHp = mainPokemonData['stat'][0];
            var currentHp = mainPokemonData['hp'];
            var remainingHp = currentHp / maxHp;

            var attacksString = mainPokemonData[attackNumber]['pp'];
            var remainingAttacks = attacksString.slice(0, attacksString.indexOf('/'));

            console.log('[Bot] Pokemon status: hp=' + remainingHp + ', atk=' + remainingAttacks);

            if (remainingHp <= 0.5 || remainingAttacks <= 5) {
                console.log('[Bot] Pokemon need heel');
                needHeel = true;
            }
            else {
                console.log('[Bot] Pokemon NO needed heel')
            }

            needToCheckPokemon = false;
        }

        if (!isBattle && prevIsBattle) {
            needToCheckPokemon = true;
            UpdateMainPokemonData();
        }

        prevIsBattle = isBattle;
        if (!stopBot) {
            Update();
        }
      }, 1500);
}

function UpdateMainPokemonData(callback = null) {
    console.log('[Bot] Updating main pokemon...');
    $.ajax({
    url: "/do/pokemons",
    type: "POST",
    data: {
        id: 'pokemons',
        type: 'open',
        val: 2
        },
    success: function(response) {
        console.log('[Bot] Finding main pokemon...');
        response = JSON.parse(response);
        $.each(response['response']['pokemon_list'], function(x, y) {
            var pokemonData = y['pok'];
            if (pokemonData['start'] == 1) {
                mainPokemonData = pokemonData;
                console.log('[Bot] Found main pokemon \"' + pokemonData['name'] + '\"');
                if (callback != null) {
                    callback();
                }
            }
        });
    }});
}

function GoToHealPokemon() {
    $.ajax({
        url: "/do/updateLocation",
        type: "POST",
        data: {
            'userAssault':assault
        },
        success: function (response) {
            response = JSON.parse(response);
            
            console.log('[Bot] Going to id 1...');
            PP.route.go(pathTable[1]['Id']);
            setTimeout(function() {
                console.log('[Bot] Reach id 1, going to id 2...');
                PP.route.go(pathTable[2]['Id']);
                setTimeout(function() {
                    console.log('[Bot] Reach id 2, healing...');
                    PP.npc.addons(['heal']);
                    setTimeout(function() {
                        console.log('[Bot] Healed, going to id 1...');
                        PP.route.go(pathTable[1]['Id']);
                        setTimeout(function() {
                            console.log('[Bot] Reach id 1, goind to id 0...');
                            PP.route.go(pathTable[0]['Id']);
                            setTimeout(function() {
                                console.log('[Bot] Reach id 0, begin farming...');
                                isHealing = false;
                                assault = !0;
                                console.log('[Bot] Farm began, pokemon healed');
                            }, 2000);
                        }, 2000);
                    }, 2000);
                }, 2000);
            }, 2000);
        }
    });
}

function StopBot() {
    stopBot = true;
    assault = !1;
}

function Evaluate(s) {
    return (s.replace(/\s/g, '').match(/[+\-]?([0-9\.]+)/g) || [])
        .reduce(function(sum, value) {
            return parseFloat(sum) + parseFloat(value);
        });
}

console.log('[Bot] Start!')
UpdateMainPokemonData(Initialize);