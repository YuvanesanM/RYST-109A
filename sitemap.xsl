<?xml version="1.0" encoding="UTF-8"?>
<xsl:stylesheet version="1.0"
  xmlns:xsl="http://www.w3.org/1999/XSL/Transform"
  xmlns:sm="http://www.sitemaps.org/schemas/sitemap/0.9"
  xmlns:image="http://www.google.com/schemas/sitemap-image/1.1"
  exclude-result-prefixes="sm image">

  <xsl:output method="html" encoding="UTF-8" indent="yes" doctype-system="about:legacy-compat"/>

  <xsl:template match="/">
    <html lang="en">
      <head>
        <meta charset="UTF-8"/>
        <meta name="viewport" content="width=device-width,initial-scale=1"/>
        <meta name="robots" content="noindex,follow"/>
        <title>Sitemap · RYST 109A</title>
        <style>
          *,*::before,*::after{box-sizing:border-box;margin:0;padding:0}
          body{font-family:system-ui,-apple-system,sans-serif;background:#f0f5f4;color:#0e2420;line-height:1.6;padding:2.5rem 1rem;-webkit-font-smoothing:antialiased}
          .wrap{max-width:900px;margin:0 auto}
          header{margin-bottom:1.75rem}
          h1{font-size:1.4rem;font-weight:700;color:#0e2420;letter-spacing:-.01em}
          .sub{color:#6b8480;font-size:.875rem;margin-top:.25rem}
          .sub strong{color:#0e2420}
          table{width:100%;border-collapse:collapse;background:#fff;border-radius:10px;overflow:hidden;box-shadow:0 1px 4px rgba(14,36,32,.08)}
          thead{background:#0e2420}
          th{padding:.7rem 1.1rem;text-align:left;font-size:.72rem;font-weight:600;letter-spacing:.07em;text-transform:uppercase;color:#c8e8e4}
          td{padding:.8rem 1.1rem;border-bottom:1px solid #e2eeec;font-size:.85rem;vertical-align:top}
          tr:last-child td{border-bottom:none}
          tr:hover td{background:#f5fbf9}
          .url a{color:#0b3d52;text-decoration:none;word-break:break-all}
          .url a:hover{text-decoration:underline}
          .img-row{margin-top:.35rem;font-size:.78rem;color:#6b8480;word-break:break-all}
          .img-title{display:inline-block;margin-top:.3rem;background:#e2eeec;color:#0b3d52;font-size:.72rem;padding:.15rem .5rem;border-radius:4px}
          .date{white-space:nowrap;color:#6b8480;font-size:.82rem}
          footer{margin-top:1.5rem;text-align:center;font-size:.75rem;color:#6b8480}
          footer a{color:#6b8480}
        </style>
      </head>
      <body>
        <div class="wrap">
          <header>
            <h1>Sitemap · RYST 109A</h1>
            <p class="sub">
              This file is read by search engines. &#160;
              <strong><xsl:value-of select="count(sm:urlset/sm:url)"/></strong> URLs listed.
            </p>
          </header>

          <table>
            <thead>
              <tr>
                <th>URL</th>
                <th>Last modified</th>
              </tr>
            </thead>
            <tbody>
              <xsl:for-each select="sm:urlset/sm:url">
                <tr>
                  <td class="url">
                    <a href="{sm:loc}"><xsl:value-of select="sm:loc"/></a>
                    <xsl:if test="image:image">
                      <div class="img-row">
                        <xsl:value-of select="image:image/image:loc"/>
                      </div>
                      <div class="img-title">
                        <xsl:value-of select="image:image/image:title"/>
                      </div>
                    </xsl:if>
                  </td>
                  <td class="date"><xsl:value-of select="sm:lastmod"/></td>
                </tr>
              </xsl:for-each>
            </tbody>
          </table>

          <footer>
            <a href="https://www.sitemaps.org/">sitemaps.org</a> &#160;·&#160;
            <a href="https://developers.google.com/search/docs/crawling-indexing/sitemaps/overview">Google Sitemaps docs</a>
          </footer>
        </div>
      </body>
    </html>
  </xsl:template>

</xsl:stylesheet>
