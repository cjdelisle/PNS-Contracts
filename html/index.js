/*@flow*/
/*::
const { ethers } = require('hardhat');
const $ = require('jquery');
import type { Var_t, PnsConstructor_t } from './pns.js';
*/
window.pns = window.pns || {};
$(async () => {
    // Ensure ethers.js is available
    if (typeof ethers === 'undefined') {
        console.error("Ethers.js not loaded");
        return;
    }

    // Define the BASE chain parameters
    const BASE_CHAIN_ID = '0x2105'; // BASE chain ID in hexadecimal
    const BASE_RPC_URL = "https://mainnet.base.org"; // Replace with the actual BASE RPC URL

    // Set up the provider
    const provider = new ethers.BrowserProvider(window.ethereum);

    try {
        // Prompt user to connect their wallet
        await provider.send("eth_requestAccounts", []);

        // Check if the current network is BASE, and switch if necessary
        const { chainId } = await provider.getNetwork();
        if (chainId !== BASE_CHAIN_ID) {
            await provider.send("wallet_switchEthereumChain", [{ chainId: BASE_CHAIN_ID }]);
        }
    } catch (error) {
        if (error.code === 4902) {
            // If the chain is not added, prompt the user to add it
            await provider.send("wallet_addEthereumChain", [{
                chainId: BASE_CHAIN_ID,
                rpcUrls: [BASE_RPC_URL],
                chainName: "BASE", // Provide a human-readable name for the chain
                nativeCurrency: {
                    name: "BASE Token", // Name of the native currency
                    symbol: "BASE", // Symbol of the native currency
                    decimals: 18,
                },
            }]);
        } else {
            console.error("Error connecting to the wallet:", error);
        }
    }

    const PNS /*:PnsConstructor_t*/ = window.PNS;
    const backend = await PNS(provider);

    backend.setErrorHandler((err) => {
        alert("There was an error: " + err.stack);
    });
    backend.setTxidHandler((txid) => {
        alert("Success: " + txid);
    });

    const setTab = (tab /*:string*/) => {
        $('.tab.active').removeClass('active');
        $('#' + tab).addClass('active');
    };

    const admin = async () => {
        let adm = await backend.admin();
        adm.owner.setter((v) => { $('#ownerInput').val(v); });
        adm.admin.setter((v) => { $('#adminInput').val(v); });
        adm.priceHalving.setter((v) => { $('#halvingInput').val(v); });
        adm.whitelistActive.setter((v) => { $('#whitelistActive').prop('checked', v); });
        adm.whitelist.setter((v) => { $('#whitelistStatus').val(v); });

        $('#admin-clickTrustContract').click(() => {
            const addr = String($('#admin-trustContract').val());
            const trust = !!$('#infra-trustContractTrust').val();
            (async () => {
                $('#spinner').removeClass('hidden');
                await adm.trustContract(addr, trust);
                $('#spinner').addClass('hidden');
            })();
        });

        window.pns.admin = Object.freeze({
            getOwner: adm.owner.update,
            setOwner: () => adm.updateOwner($('#ownerInput').val().toString()),
            getAdmin: adm.admin.update,
            setAdmin: () => adm.updateAdmin($('#adminInput').val().toString()),
            getPriceHalving: adm.priceHalving.update,
            // The results come back through the setters
            setPriceHalving: () => adm.updatePriceHalvingSeconds(Number($('#halvingInput').val())),
            checkWhitelist: () => adm.queryWhitelist($('#whitelistAddress').val().toString()),
            updateWhitelist: () => {
                const address = $('#whitelistAddress').val().toString();
                const adding = $('#addAddress').prop('checked');
                const enable = $('#whitelistActive').prop('checked');
                adm.updateWhitelist(address, adding, enable);
            },
            setBlacklisted: () => {
                const id = $('#domainId').val().toString();
                const blacklist = $('#blacklistDomain').prop('checked');
                adm.updateDomainBlacklisted(id, blacklist);
            },
        });
    };

    const names = () => {

    };

    const records = () => {

    };

    const bindVarToInput = (v /*:Var_t<string>|Var_t<number>*/, $input /*:JQuery*/) => {
        v.setter(async (msg) => { $input.val(msg); });
        $input.on('input', () => v.update($input.val()));
    };
    const bindVarToSelect = (v /*:Var_t<string>*/, $select /*:JQuery*/) => {
        v.setter(async (id) => { $select.val(id); });
        $select.change(() => v.update($select.val()));
    };
    const bindVarToCheckbox = (v /*:Var_t<boolean>*/, $checkbox /*:JQuery*/) => {
        v.setter(async (checked) => { $checkbox.prop('checked', checked); });
        $checkbox.change(() => v.update($checkbox.prop('checked')));
    };

    const infra = async () => {
        const inf = await backend.infra();
        inf.totalYc.setter((v) => { $('#infra-totalYieldCredits').text(v); });
        inf.assignedYc.setter((v) => { $('#infra-assignedYieldCredits').text(v); });
        inf.cjdnsDailyPerMillion.setter((v) => { $('#infra-cjdnsDailyYield').text(v); });
        inf.domainDailyPerMillion.setter((v) => { $('#infra-domainDailyYield').text(v); });

        let setNodeId = async (x /*:string*/) => {};

        inf.unitTable.setter((data) => {
            // Clear the existing table body
            $('#infra-table tbody').empty();
        
            // Check if data exists and has items
            if (data && data.length > 0) {
                // Iterate over the data array and populate each row
                data.forEach((item) => {
                    // Create a new row with the data
                    const row = `
                        <tr>
                            <td>${item.id}</td>
                            <td>${item.name}</td>
                            <td>${item.t}</td>
                            <td>${item.assignedCredits}</td>
                            <td>${item.assignedCreditsDollarized}</td>
                            <td>${item.statusOk ? '✔️' : '❌'}</td>
                            <td>${item.weekUptime}%</td>
                            <td>${item.bonus !== null ? item.bonus : '-'}</td>
                            <td>${item.penalty !== null ? item.penalty : '-'}</td>
                            <td>${item.dailyYield}</td>
                            <td><button id="infra-editCjdns-${item.id}">Edit</button></td>
                        </tr>
                    `;
        
                    // Append the row to the table body
                    $('#infra-table tbody').append(row);
                });
                data.forEach((item) => {
                    $(`#infra-editCjdns-${item.id}`).click(() => {
                        setNodeId(item.id);
                        $('#infra-updateCjdnsNodeId').text(item.id);
                        $('#infra-updateCjdnsNode').removeClass('hidden');
                    });
                });
            } else {
                // If no data, show a "No Data Available" message
                const noDataRow = `
                    <tr>
                        <td colspan="10">No Data Available</td>
                    </tr>
                `;
                $('#infra-table tbody').append(noDataRow);
            }
        });
        
        const createCjdns = async () => {
            const cj = await inf.createUpdateCjdns();

            $('#infra-registerCjdnsNodeButton').click(() => {
                if ($('#infra-registerCjdnsNode').hasClass('hidden')) {
                    $('#infra-registerCjdnsNode').removeClass('hidden');
                } else {
                    $('#infra-registerCjdnsNode').addClass('hidden');
                }
            });

            cj.domainOptions.setter((data) => {
                $('#infra-nodeDomain').empty();
                $.each(data, (value, text) => {
                    const opt = $('<option></option>');
                    opt.val(value);
                    opt.text(text);
                    $('#infra-nodeDomain').append(opt);
                });
            });

            cj.createButtonActive.setter((active) => {
                if (active) {
                    $('#infra-registerCjdnsButton').removeAttr('disabled');
                } else {
                    $('#infra-registerCjdnsButton').attr('disabled', 'disabled');
                }
            });

            cj.nodeNameValidation.setter((msg) => {
                console.log('set value', msg);
                $('#infra-nodeName-validationErr').text(msg);
            });
            cj.yieldCreditsValidation.setter((msg) => {
                $('#infra-cjdnsYieldCredits-validationErr').text(msg);
            });
            cj.yieldCreditsDollarized.setter((msg) => {
                $('#infra-dollarizedValue').text('$' + msg);
            });

            bindVarToInput(cj.yieldCredits, $('#infra-cjdnsYieldCredits'));
            bindVarToInput(cj.name, $('#infra-nodeName'));        
            bindVarToSelect(cj.domain, $('#infra-nodeDomain'));
            $('#infra-maxCreditsButton').click(cj.clickMaxCreditsButton);
            bindVarToCheckbox(cj.enableVPN, $('#infra-enableVPN'));
            bindVarToCheckbox(cj.privateNode, $('#infra-privateCjdns'));

            $('#infra-registerCjdnsButton').click(() => {
                (async () => {
                    $('#spinner').removeClass('hidden');
                    await cj.createOrUpdate();
                    $('#spinner').addClass('hidden');
                })();
            });
        };

        const updateCjdns = async () => {
            const cj = await inf.createUpdateCjdns();

            cj.domainOptions.setter((data) => {
                $('#infra-updNodeDomain').empty();
                $.each(data, (value, text) => {
                    const opt = $('<option></option>');
                    opt.val(value);
                    opt.text(text);
                    $('#infra-updNodeDomain').append(opt);
                });
            });

            cj.createButtonActive.setter((active) => {
                if (active) {
                    $('#infra-updateCjdnsButton').removeAttr('disabled');
                } else {
                    $('#infra-updateCjdnsButton').attr('disabled', 'disabled');
                }
            });

            cj.nodeNameValidation.setter((msg) => {
                $('#infra-updNodeName-validationErr').text(msg);
            });
            cj.yieldCreditsValidation.setter((msg) => {
                $('#infra-updCjdnsYieldCredits-validationErr').text(msg);
            });
            cj.yieldCreditsDollarized.setter((msg) => {
                $('#infra-updDollarizedValue').text('$' + msg);
            });

            bindVarToInput(cj.yieldCredits, $('#infra-updCjdnsYieldCredits'));
            bindVarToInput(cj.name, $('#infra-updNodeName'));        
            bindVarToSelect(cj.domain, $('#infra-updNodeDomain'));
            $('#infra-updMaxCreditsButton').click(cj.clickMaxCreditsButton);
            bindVarToCheckbox(cj.enableVPN, $('#infra-updEnableVPN'));
            bindVarToCheckbox(cj.privateNode, $('#infra-updPrivateCjdns'));

            $('#infra-updateCjdnsButton').click(() => {
                (async () => {
                    $('#spinner').removeClass('hidden');
                    await cj.createOrUpdate();
                    $('#spinner').addClass('hidden');
                })();
            });

            setNodeId = cj.setNodeId;
        };

        createCjdns();
        updateCjdns();
    };

    window.pns.showTab = (tab) => {
        setTab(tab);
        switch (tab) {
            case 'admin': return admin();
            case 'names': return names();
            case 'records': return records();
            case 'infra': return infra();
            default: alert("Invalid tab: " + tab);
        }
    };

    window.pns.showTab('admin');
});