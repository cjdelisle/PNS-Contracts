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
        let setDomainId = async (x /*:string*/) => {};

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
                        if (item.t == 'Vpn' || item.t.indexOf('Cjdns') > -1) {
                            setNodeId(item.id);
                            $('#infra-registerCjdnsTitle').text('Update Cjdns Node ' + item.id);
                            $('#infra-registerCjdnsButton').text('Save');
                            $('#infra-cjdnsDetails').removeClass('hidden');
                            $('.formSection').addClass('hidden'); // Hide everything else
                            $('#infra-registerCjdnsNode').removeClass('hidden');
                        } else if (item.t.indexOf('Domain') > -1) {
                            setDomainId(item.id)
                            $('#infra-registerDomainTitle').text('Update Domain ' + item.id);
                            $('#infra-registerDomainConfirm').text('Save');
                            $('#infra-registerDomainTld').addClass('hidden'); // Do not show TLD when updating
                            $('.formSection').addClass('hidden'); // Hide everything else
                            $('#infra-registerDomain').removeClass('hidden');
                        } else {
                            throw new Error("Unsupported node type")
                        }
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

        const createDomain = async () => {
            const dom = await inf.createUpdateDomain();

            $('#infra-registerDomainButton').click(() => {
                if ($('#infra-registerDomain').hasClass('hidden')) {
                    dom.setNodeId(null);
                    $('#infra-registerDomainTitle').text('Create New Domain');
                    $('#infra-registerDomainConfirm').text('Create');
                    $('#infra-registerDomainTld').removeClass('hidden'); // Allow selecting TLD when registering
                    $('.formSection').addClass('hidden'); // Hide everything else
                    $('#infra-registerDomain').removeClass('hidden');
                } else {
                    $('.formSection').addClass('hidden'); // Hide everything
                }
            });

            dom.tldOptions.setter((data) => {
                $('#infra-domainTld').empty();
                $.each(data, (_value, text) => {
                    const opt = $('<option></option>');
                    opt.val(text);
                    opt.text(text);
                    $('#infra-domainTld').append(opt);
                });
            });

            bindVarToCheckbox(dom.resolveDangerous, $('#infra-resolveDangerous'));
            bindVarToInput(dom.yieldCredits, $('#infra-domainYieldCredits'));
            bindVarToSelect(dom.domain, $('#infra-domainTld'));

            $('#infra-domainMaxCreditsButton').click(dom.clickMaxCreditsButton);

            dom.yieldCreditsValidation.setter((msg) => {
                $('#infra-domainYieldCredits-validationErr').text(msg);
            });
            dom.yieldCreditsDollarized.setter((msg) => {
                $('#infra-domainDollarizedValue').text('$' + msg);
            });

            dom.createButtonActive.setter((active) => {
                console.log('dom.createButtonActive', active);
                if (active) {
                    $('#infra-registerDomainConfirm').removeAttr('disabled');
                } else {
                    $('#infra-registerDomainConfirm').attr('disabled', 'disabled');
                }
            });

            $('#infra-registerDomainConfirm').click(() => {
                (async () => {
                    $('#spinner').removeClass('hidden');
                    await dom.createOrUpdate();
                    $('#spinner').addClass('hidden');
                })();
            });

            setDomainId = dom.setNodeId;
        };
        
        const createCjdns = async () => {
            const cj = await inf.createUpdateCjdns();

            $('#infra-registerCjdnsNodeButton').click(() => {
                if ($('#infra-registerCjdnsNode').hasClass('hidden')) {
                    cj.setNodeId(null);
                    $('#infra-registerCjdnsTitle').text('Create New Cjdns');
                    $('#infra-registerCjdnsButton').text('Create');
                    $('#infra-cjdnsDetails').addClass('hidden');
                    $('.formSection').addClass('hidden');
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

            cj.nodeStatus.setter((msg) => {
                $('#infra-cjdnsDetails-nodeStatus').val(msg);
            });
            cj.publicIpv4.setter((msg) => {
                $('#infra-cjdnsDetails-publicIpv4').val(msg);
            });
            cj.peerId.setter((msg) => {
                $('#infra-cjdnsDetails-peerId').val(msg);
            });

            cj.addressBlockNetwork.setter((msg) => {
                $('#infra-cjdnsDetails-addressBlock-network').text(msg);
            });
            cj.addressBlockNodes.setter((msg) => {
                $('#infra-cjdnsDetails-addressBlock-nodes').text(msg);
            });
            cj.addressBlockBonus.setter((msg) => {
                $('#infra-cjdnsDetails-addressBlock-bonus').text(msg);
            });

            cj.ispNetwork.setter((msg) => {
                $('#infra-cjdnsDetails-isp-network').text(msg);
            });
            cj.ispNodes.setter((msg) => {
                $('#infra-cjdnsDetails-isp-nodes').text(msg);
            });
            cj.ispBonus.setter((msg) => {
                $('#infra-cjdnsDetails-isp-bonus').text(msg);
            });

            cj.ipv6Bonus.setter((msg) => {
                $('#infra-cjdnsDetails-ipv6-bonus').text(msg);
            });

            cj.totalBonus.setter((msg) => {
                $('#infra-cjdnsDetails-totalBonus').text(msg);
            });

            cj.reliabilityPercent.setter((percent) => {
                $("#infra-cjdnsDetails-progress-bar").css("width", percent + "%");
                $("#infra-cjdnsDetails-downtime").text((100 - percent) + "%");
            });
            cj.downtimePenalty.setter((msg) => {
                $('#infra-cjdnsDetails-penalty').text(msg);
                $("#infra-cjdnsDetails-downtimePenalty").text(msg);
            });
            cj.effectiveYieldCredits.setter((msg) => {
                $("#infra-cjdnsDetails-effectiveYieldCredits").text(msg);
            });
            cj.yieldPerMillionCredits.setter((msg) => {
                $("#infra-cjdnsDetails-yieldPerMillionCredits").text(msg);
            });
            cj.currentDailyYieldDollarized.setter((msg) => {
                $("#infra-cjdnsDetails-currentDailyYieldDollarized").text(msg);
            });
            cj.currentDailyYield.setter((msg) => {
                $("#infra-cjdnsDetails-currentDailyYield").val(msg);
            });
            cj.setupNodeUrl.setter((url) => {
                $('#infra-cjdnsDetails-setupNodeUrl').attr('href', url);
            });
            cj.nodeIsSetup.setter((isIt) => {
                if (isIt) {
                    $('#infra-cjdnsDetailsNotSetup').addClass('hidden');
                    $('#infra-cjdnsDetailsOperational').removeClass('hidden');
                } else {
                    $('#infra-cjdnsDetailsNotSetup').removeClass('hidden');
                    $('#infra-cjdnsDetailsOperational').addClass('hidden');
                }
            });

            $('#infra-registerCjdnsButton').click(() => {
                (async () => {
                    $('#spinner').removeClass('hidden');
                    await cj.createOrUpdate();
                    $('#spinner').addClass('hidden');
                })();
            });

            setNodeId = cj.setNodeId;
        };

        const simCjdns = async () => {
            const cj = await inf.infraCjdnsSim();

            $('#infra-cjdnsSimOpen').click(() => {
                if ($('#infra-cjdnsSim').hasClass('hidden')) {
                    $('.formSection').addClass('hidden');
                    $('#infra-cjdnsSim').removeClass('hidden');
                } else {
                    $('#infra-cjdnsSim').addClass('hidden');
                }
            });

            bindVarToInput(cj.ipv4Address, $('#infra-cjdnsSimIpv4'));
            bindVarToCheckbox(cj.hasIpv6, $('#infra-cjdnsSimHasIpv6'));

            cj.ipv4AddressValidationError.setter((msg) => {
                $('#infra-cjdnsSimIpv4-validationErr').text(msg);
            });

            cj.addressBlockNetwork.setter((msg) => {
                $('#infra-cjdnsSim-addressBlock-network').text(msg);
            });
            cj.addressBlockNodes.setter((msg) => {
                $('#infra-cjdnsSim-addressBlock-nodes').text(msg);
            });
            cj.addressBlockBonus.setter((msg) => {
                $('#infra-cjdnsSim-addressBlock-bonus').text(msg);
            });

            cj.ispNetwork.setter((msg) => {
                $('#infra-cjdnsSim-isp-network').text(msg);
            });
            cj.ispNodes.setter((msg) => {
                $('#infra-cjdnsSim-isp-nodes').text(msg);
            });
            cj.ispBonus.setter((msg) => {
                $('#infra-cjdnsSim-isp-bonus').text(msg);
            });

            cj.ipv6Bonus.setter((msg) => {
                $('#infra-cjdnsSim-ipv6-bonus').text(msg);
            });

            cj.totalBonus.setter((msg) => {
                $('#infra-cjdnsSim-totalBonus').text(msg);
            })
        };

        createCjdns();
        createDomain();
        simCjdns();
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