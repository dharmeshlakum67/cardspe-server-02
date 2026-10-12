type THeaderPair = [string, string];

const BODY_METHODS = ['POST', 'PUT', 'PATCH'];
const AUTH_HEADER_KEYS = ['authorization', 'x-api-key', 'api-key'];

// HEADERS SENT BY THE SAMPLE (SAME DEFAULTS AS THE cURL / AXIOS / PYTHON SNIPPETS)
export const buildSnippetHeaders = (
	method: string,
	headers: { key?: string; value?: string }[],
): THeaderPair[] => {
	const pairs: THeaderPair[] = [];
	const hasAuth = headers.some(
		(h) => h.key && AUTH_HEADER_KEYS.includes(h.key.toLowerCase().trim()),
	);
	if (!hasAuth) pairs.push(['Authorization', 'Bearer YOUR_API_KEY']);
	if (
		BODY_METHODS.includes(method) &&
		!headers.some((h) => h.key && h.key.toLowerCase().trim() === 'content-type')
	) {
		pairs.push(['Content-Type', 'application/json']);
	}
	headers.forEach((h) => {
		if (h.key && h.key.trim() !== '') {
			pairs.push([h.key.trim(), h.value?.trim() || 'YOUR_VALUE']);
		}
	});
	return pairs;
};

const minifyBody = (body: string) => {
	try {
		return JSON.stringify(JSON.parse(body));
	} catch {
		return body;
	}
};

const escapeDoubleQuoted = (value: string) =>
	value.replace(/\\/g, '\\\\').replace(/"/g, '\\"').replace(/\r?\n/g, '\\n');

const escapePhpDoubleQuoted = (value: string) =>
	escapeDoubleQuoted(value).replace(/\$/g, '\\$');

const escapePhpSingleQuoted = (value: string) =>
	value.replace(/\\/g, '\\\\').replace(/'/g, "\\'");

// JAVA 11+ (java.net.http.HttpClient)
export const buildJavaSnippet = (
	method: string,
	url: string,
	headers: THeaderPair[],
	requestBody?: string | null,
): string => {
	const hasBody = Boolean(requestBody) && BODY_METHODS.includes(method);

	let java = `import java.net.URI;\n`;
	java += `import java.net.http.HttpClient;\n`;
	java += `import java.net.http.HttpRequest;\n`;
	java += `import java.net.http.HttpResponse;\n\n`;
	java += `public class ApiExample {\n`;
	java += `    public static void main(String[] args) throws Exception {\n`;
	java += `        HttpClient client = HttpClient.newHttpClient();\n\n`;
	if (hasBody) {
		java += `        String body = "${escapeDoubleQuoted(minifyBody(requestBody as string))}";\n\n`;
	}
	java += `        HttpRequest request = HttpRequest.newBuilder()\n`;
	java += `            .uri(URI.create("${escapeDoubleQuoted(url)}"))\n`;
	headers.forEach(([key, value]) => {
		java += `            .header("${escapeDoubleQuoted(key)}", "${escapeDoubleQuoted(value)}")\n`;
	});
	java += hasBody
		? `            .method("${method}", HttpRequest.BodyPublishers.ofString(body))\n`
		: `            .method("${method}", HttpRequest.BodyPublishers.noBody())\n`;
	java += `            .build();\n\n`;
	java += `        HttpResponse<String> response =\n`;
	java += `            client.send(request, HttpResponse.BodyHandlers.ofString());\n\n`;
	java += `        System.out.println(response.statusCode());\n`;
	java += `        System.out.println(response.body());\n`;
	java += `    }\n`;
	java += `}`;
	return java;
};

// PHP (cURL EXTENSION)
export const buildPhpSnippet = (
	method: string,
	url: string,
	headers: THeaderPair[],
	requestBody?: string | null,
): string => {
	const hasBody = Boolean(requestBody) && BODY_METHODS.includes(method);

	let php = `<?php\n\n`;
	php += `$curl = curl_init();\n\n`;
	if (hasBody) {
		php += `$payload = '${escapePhpSingleQuoted(minifyBody(requestBody as string))}';\n\n`;
	}
	php += `curl_setopt_array($curl, [\n`;
	php += `    CURLOPT_URL => "${escapePhpDoubleQuoted(url)}",\n`;
	php += `    CURLOPT_RETURNTRANSFER => true,\n`;
	php += `    CURLOPT_CUSTOMREQUEST => "${method}",\n`;
	php += `    CURLOPT_HTTPHEADER => [\n`;
	headers.forEach(([key, value]) => {
		php += `        "${escapePhpDoubleQuoted(`${key}: ${value}`)}",\n`;
	});
	php += `    ],\n`;
	if (hasBody) {
		php += `    CURLOPT_POSTFIELDS => $payload,\n`;
	}
	php += `]);\n\n`;
	php += `$response = curl_exec($curl);\n`;
	php += `$error = curl_error($curl);\n`;
	php += `curl_close($curl);\n\n`;
	php += `if ($error) {\n`;
	php += `    echo "cURL Error: " . $error;\n`;
	php += `} else {\n`;
	php += `    echo $response;\n`;
	php += `}`;
	return php;
};
