function get_nbp_data_month(currencies) {
    // Deklaracja słownika dla API NBP - zamiana miesiąca na odpowiednią strukturę
    let month_day_string = {
        1: '01-31',
        2: '02-28',
        3: '03-31',
        4: '04-30',
        5: '05-31',
        6: '06-30',
        7: '07-31',
        8: '08-31',
        9: '09-30',
        10: '10-31',
        11: '11-30',
        12: '12-31'
    };
    for (let m = 1; m <= 12; m++) {
        // Ewentualna zamiana podanego numeru miesiąca do formatu 2-miejscowego, np. 1 => 01
        if (m < 10) {
            var m_formatted = '0' + m;
        } else {
            var m_formatted = m;
        };
        // Stworzenie URL do zapytania do api NBP dla konkretnego miesiąca
        var url_api = 'http://api.nbp.pl/api/exchangerates/tables/C/2019-' + m_formatted + '-01/2019-' + month_day_string[m];

        // Zapytanie AJAX do api NBP (powyższy URL)
        // Async bo inaczej problem z przerzucaniem danych
        $.ajax({
            url: url_api,
            dataType: 'json',
            async: false,
            success: function (data) {
                // NBP nie zawsze publikowało każdy dzień, dlatego przypisanie ilości dni opublikowanych do stałej blokowej
                const NBP_length_of_month = data.length;
                // Pętla przechodząca przez każdy opublikowany dzień miesiąca
                data.forEach(day_of_month => {
                    const day = day_of_month['rates'];
                    // Pętla po konkretnych walutach
                    day.forEach(currency => {
                        const symbol = currency['code'];
                        const ask = currency['ask'];
                        const bid = currency['bid'];
                        // Dodanie wartości kupna (bid) i sprzedaży (ask) do słownika currencies dla danej waluty i danego miesiąca
                        currencies[symbol]['months'][m]['bid'] += bid;
                        currencies[symbol]['months'][m]['ask'] += ask;
                    });
                });
                // Wyliczenie średniej z miesiąca dla każdej waluty z zaokrągleniem do 4 miejsc
                for (let symbol in currencies) {
                    let currency = currencies[symbol]['months'][m]
                    currency['ask'] = (currency['ask'] / NBP_length_of_month).toFixed(4);
                    currency['bid'] = (currency['bid'] / NBP_length_of_month).toFixed(4);
                };

            }
        });
    };
};

function generate_chart_NBP(id, dict) {
    let title_dom = $('#chart-title');
    title_dom.text(dict[id]['name'][0].toUpperCase() + dict[id]['name'].slice(1))
    let months = dict[id]['months']
    let cols_bid = new Array();
    cols_bid.push('Kupno');
    let cols_ask = new Array();
    cols_ask.push('Sprzedaż')
    for (let x = 1; x <= 12; x++) {
        var bid = months[x]['bid'];
        var ask = months[x]['ask'];
        cols_bid.push(bid);
        cols_ask.push(ask);
    }

    bb.generate({
        bindto: "#chart",
        data: {
            x: "x",
            type: "spline",
            columns: [
                ["x", "Styczeń", "Luty", "Marzec", "Kwiecień", "Maj", "Czerwiec", "Lipiec", "Sierpień", "Wrzesień", "Październik", "Listopad", "Grudzień"],
                cols_bid,
                cols_ask
            ]
        },
        axis: {
            x: {
                type: "category",
                label: {
                    text: "Miesiące (2019 rok)",
                    position: "inner-center"
                }
            }
        }
    });
    $('.spinner').hide();
}

function create_dropdown(dict) {
    let dom_dropdown = $('#currencies-dropdown')
    for (let key in dict) {
        let name = dict[key]['name'];
        let dropdown_element = '<a class="dropdown-item" id=' + key + ' href="#" onclick="generate_chart_NBP(this.id,currencies)">' + name[0].toUpperCase() + name.slice(1) + '</a>';
        dom_dropdown.append(dropdown_element)
    };

}

function generate_users(dict) {
    $.ajax({
        url: 'https://randomuser.me/api/?results=1000&inc=dob,gender,nat',
        dataType: 'json',
        async: false,
        success: function (data) {

            let result = data['results'];
            result.forEach(person => {
                if (person['gender'] == 'female') {
                    dict['genders']['f'] += 1;
                } else {
                    dict['genders']['m'] += 1;
                }
                let nat_symbol = person['nat'];
                dict['nationalities'][nat_symbol] += 1
                let person_age = person['dob']['age']
                switch (true) {
                    case (person_age < 11):
                        dict['ages']['0-10'] += 1
                        break;

                    case (person_age < 21):
                        dict['ages']['11-20'] += 1
                        break;

                    case (person_age < 31):
                        dict['ages']['21-30'] += 1
                        break;

                    case (person_age < 41):
                        dict['ages']['31-40'] += 1
                        break;

                    case (person_age < 51):
                        dict['ages']['41-50'] += 1
                        break;

                    case (person_age < 61):
                        dict['ages']['51-60'] += 1
                        break;

                    case (person_age < 71):
                        dict['ages']['61-70'] += 1
                        break;

                    case (person_age < 81):
                        dict['ages']['71-80'] += 1
                        break;

                    case (person_age < 91):
                        dict['ages']['81-90'] += 1
                        break;

                    case (person_age <= 100):
                        dict['ages']['91-100'] += 1
                        break;

                    case (person_age > 100):
                        dict['ages']['100+'] += 1
                        break;

                    default:
                        break;
                }
            });
            $('.spinner2').hide();

        }
    });
}


function generate_charts_users(users_dict) {

    bb.generate({
        bindto: "#chart_genders",
        data: {
            type: "pie",
            columns: [
                ['Mężczyźni', users_dict['genders']['m']],
                ['Kobiety', users_dict['genders']['f']]
            ]
        }
    });

    let columns_data = new Array();
    let nat_keys = users_dict['nationalities'];
    let nat_names = new Array();
    let x_names = new Array();
    nat_names.push('x');
    let nat_values = new Array();
    nat_values.push('Liczba użytkowników')
    let full_name = ''
    for (var key in nat_keys) {

        nat_values.push(nat_keys[key])
        switch (key) {
            case 'AU':
                full_name = 'Australia';
                break;
            case 'BR':
                full_name = 'Brazylia';
                break;
            case 'CA':
                full_name = 'Kanada';
                break;
            case 'CH':
                full_name = 'Szwajcaria';
                break;
            case 'DE':
                full_name = 'Niemcy';
                break;
            case 'DK':
                full_name = 'Dania';
                break;
            case 'ES':
                full_name = 'Hiszpania';
                break;
            case 'FI':
                full_name = 'Finlandia';
                break;
            case 'FR':
                full_name = 'Francja';
                break;
            case 'GB':
                full_name = 'Wielka Brytania';
                break;
            case 'IE':
                full_name = 'Irlandia';
                break;
            case 'IR':
                full_name = 'Iran';
                break;
            case 'NO':
                full_name = 'Norwegia';
                break;
            case 'NL':
                full_name = 'Holandia';
                break;
            case 'NZ':
                full_name = 'Nowa Zelandia';
                break;
            case 'TR':
                full_name = 'Turcja';
                break;
            case 'US':
                full_name = 'Stany Zjednoczone';
                break;
            default:
                break;
        }
        nat_names.push(full_name);
        x_names.push(full_name);
    };

    columns_data.push(nat_names)
    columns_data.push(nat_values)
    bb.generate({
        bindto: "#chart_nats",
        data: {
            x: 'x',
            type: "bar",
            columns: columns_data,

        },
        legend: {
            show: false
        },
        axis: {
            x: {
                type: 'category',
                tick: {
                    culling: false,
                    rotate: 75,
                    multiline: false,
                    tooltip: true
                }
            }
        },

    });
    let columns_data_ages = new Array();
    let age_keys = users_dict['ages'];
    for (var key in age_keys) {
        let age_values = new Array();
        if (age_keys[key] != 0) {
            age_values.push(key);
            age_values.push(age_keys[key])
        }
        columns_data_ages.push(age_values)
    };
    bb.generate({
        bindto: "#chart_ages",
        data: {
            type: "pie",
            columns: columns_data_ages
        }
    });
}
