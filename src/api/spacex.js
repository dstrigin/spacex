const SPACEX_ORG_ID = "121"

class SpaceX {
    constructor(baseUrl = "https://lldev.thespacedevs.com/2.3.0/") {
        this.baseUrl = baseUrl;
    }

    request(url) {
        return fetch(url)
            .then(response => {
                if (!response.ok) {
                    throw new Error(`Space API request failed: ${response.status}`);
                }

                return response.json();
            });
    }

    launches() {
        const url = new URL("launches/", this.baseUrl);
        url.search = new URLSearchParams({
            lsp__id: SPACEX_ORG_ID,
            limit: "100",
            ordering: "-net",
        });

        return this.request(url).then(data => data.results);
    }

    launchpads() {
        const url = new URL("pads/", this.baseUrl);
        url.search = new URLSearchParams({
            limit: "100",
            agencies_ids: SPACEX_ORG_ID,
        });

        return this.requestAllPages(url);
    }

    launchpad(id) {
        return this.request(new URL(`pads/${id}/`, this.baseUrl));
    }

    async requestAllPages(url) {
        const items = [];
        let nextUrl = url;

        while (nextUrl) {
            const data = await this.request(nextUrl);
            items.push(...data.results);
            nextUrl = data.next;
        }

        return items;
    }

}

export {SpaceX}
