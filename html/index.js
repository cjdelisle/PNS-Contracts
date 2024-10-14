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

    const backend = await window.PNS(provider);



    const setTab = (tab) => {
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

        window.pns.admin = Object.freeze({
            getOwner: adm.owner.update,
            setOwner: () => adm.updateOwner($('#ownerInput').val()),
            getAdmin: adm.admin.update,
            setAdmin: () => adm.updateAdmin($('#adminInput').val()),
            getPriceHalving: adm.priceHalving.update,
            // The results come back through the setters
            setPriceHalving: () => adm.updatePriceHalvingSeconds($('#halvingInput').val()),
            checkWhitelist: () => adm.queryWhitelist($('#whitelistAddress').val()),
            updateWhitelist: () => {
                const address = $('#whitelistAddress').val();
                const adding = $('#addAddress').prop('checked');
                const enable = $('#whitelistActive').prop('checked');
                adm.updateWhitelist(address, adding, enable);
            },
            setBlacklisted: () => {
                const id = $('#domainId').val();
                const blacklist = $('#blacklistDomain').prop('checked');
                adm.updateDomainBlacklisted(id, blacklist);
            },
        });
        admin.getOwner = adm.owner.update;
    };

    const names = () => {

    };

    const records = () => {

    };

    const infra = async () => {
        const inf = await backend.infra();
        inf.totalYc.setter((v) => { $('#infra-totalYieldCredits').text(v); });
        inf.assignedYc.setter((v) => { $('#infra-assignedYieldCredits').text(v); });
        inf.cjdnsDailyPerMillion.setter((v) => { $('#infra-cjdnsDailyYield').text(v); });
        inf.domainDailyPerMillion.setter((v) => { $('#infra-domainDailyYield').text(v); });
        
        const createCjdns = async () => {
            const cj = await inf.createCjdns();

            cj.domainOptions.setter((data) => {
                $('#infra-nodeDomain').empty();
                $.each(data, (value, text) => {
                    $('#infra-nodeDomain').append(
                        $('<option></option>').val(value).text(text)
                    );
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
                $('#infra-nodeName-validationErr').text(msg);
            });
            cj.yieldCreditsValidation.setter((msg) => {
                $('#infra-cjdnsYieldCredits-validationErr').text(msg);
            });
            cj.yieldCreditsDollarized.setter((msg) => {
                $('#infra-dollarizedValue').text('$' + msg);
            });
            $('#infra-cjdnsYieldCredits').on('input', () => {
                console.log('ayc');
                cj.updateYieldCredits($('#infra-cjdnsYieldCredits').val());
            });
            $('#infra-nodeName').on('input', () => {
                cj.updateNodeName($('#infra-nodeName').val());
            });
            $('#infra-nodeDomain').change(() => {
                const selectedValue = $('#infra-nodeDomain').val();
                cj.updateDomainSelection(selectedValue);
            });
            $('#infra-maxCreditsButton').click(cj.clickMaxCreditsButton);
            $('#infra-enableVPN').change(() => {
                const isChecked = $('#infra-enableVPN').is(':checked');
                cj.updateEnableVpn(isChecked);
            });
            $('#infra-privateCjdns').change(() => {
                const isChecked = $('#infra-privateCjdns').is(':checked');
                cj.updatePrivateCjdns(isChecked);
            });
            $('#infra-registerCjdnsButton').click(cj.create);
        };
        $('#infra-registerCjdnsNodeButton').click(() => {
            $('#infra-registerCjdnsNode').removeClass('hidden');
            createCjdns();
        });
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